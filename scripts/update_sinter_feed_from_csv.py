#!/usr/bin/env python3
"""Atualiza o Sinter Feed dos registros a partir de um CSV de recebimento.

Uso:
    python scripts/update_sinter_feed_from_csv.py "C:\\caminho\\relatorio.csv"
    python scripts/update_sinter_feed_from_csv.py "C:\\caminho\\relatorio.csv" --apply

Por seguranca, o modo padrao e somente uma previa. Para efetivar, informe
--apply e configure DATABASE_URL no ambiente ou em api/.env. Para usar outro
arquivo, informe --env-file. Exemplo (PowerShell):
    python scripts/update_sinter_feed_from_csv.py relatorio.csv --env-file C:\\segredos\\producao.env

Dependencia:
    python -m pip install "psycopg[binary]>=3.1,<4"

O arquivo deve conter as colunas ``NF RECEBIDA`` e ``Produto``. Para cada NF,
o script atualiza ``records.sinter_feed_value`` e cadastra os Sinter Feeds
ausentes em ``sinter_feeds`` para que possam ser relacionados a um Blend.
Na importacao, ``SINTER FEED M18`` e normalizado para ``SINTER FEED 18``.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import unicodedata
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Iterable


DEFAULT_ENV_FILE = Path(__file__).resolve().parents[1] / "api" / ".env"


def normalize_header(value: str) -> str:
    """Compara cabecalhos ignorando acentos, caixa e espacos extras."""
    decomposed = unicodedata.normalize("NFKD", value)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(without_accents.upper().split())


def normalize_value(value: str) -> str:
    return " ".join(value.strip().upper().split())


def normalize_sinter_feed(value: str) -> str:
    """Normaliza o Sinter Feed e remove o prefixo M antes do numero."""
    normalized = normalize_value(value)
    return re.sub(r"^SINTER FEED M(?=\d)", "SINTER FEED ", normalized)


def read_database_url(env_file: Path) -> str | None:
    """Le DATABASE_URL de um .env simples sem alterar as variaveis do processo."""
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url

    if not env_file.is_file():
        return None

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, separator, value = line.partition("=")
        if separator and key.strip() == "DATABASE_URL":
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                value = value[1:-1]
            return value or None

    return None


def read_rows(csv_path: Path, allow_any_product: bool) -> dict[str, str]:
    """Le o CSV e devolve uma unica classificacao normalizada por NF."""
    encodings = ("utf-8-sig", "cp1252", "latin-1")
    last_error: UnicodeDecodeError | None = None

    for encoding in encodings:
        try:
            with csv_path.open("r", encoding=encoding, newline="") as source:
                reader = csv.DictReader(source, delimiter=";")
                if not reader.fieldnames:
                    raise ValueError("O CSV nao possui cabecalho.")

                headers = {normalize_header(header): header for header in reader.fieldnames}
                nf_header = headers.get("NF RECEBIDA")
                product_header = headers.get("PRODUTO")
                if not nf_header or not product_header:
                    raise ValueError(
                        "Colunas obrigatorias nao encontradas. Esperadas: "
                        "'NF RECEBIDA' e 'Produto'."
                    )

                values_by_nf: dict[str, set[str]] = defaultdict(set)
                for row in reader:
                    nf = (row.get(nf_header) or "").strip()
                    product = normalize_sinter_feed(row.get(product_header) or "")
                    if not nf or not product:
                        continue
                    if not allow_any_product and "SINTER FEED" not in product:
                        continue
                    values_by_nf[nf].add(product)

                conflicts = {
                    nf: sorted(products)
                    for nf, products in values_by_nf.items()
                    if len(products) > 1
                }
                if conflicts:
                    examples = "; ".join(
                        f"{nf}: {', '.join(products)}"
                        for nf, products in list(conflicts.items())[:5]
                    )
                    raise ValueError(
                        "Ha NFs com mais de um Sinter Feed no CSV. Corrija a planilha "
                        f"antes de continuar. Exemplos: {examples}"
                    )

                return {nf: next(iter(products)) for nf, products in values_by_nf.items()}
        except UnicodeDecodeError as error:
            last_error = error

    raise ValueError(f"Nao foi possivel decodificar o CSV: {last_error}")


def chunks(items: list[tuple[str, str]], size: int = 1_000) -> Iterable[list[tuple[str, str]]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


SUMMARY_SQL = """
WITH source(numero_nota, sinter_feed) AS (
  SELECT * FROM unnest(%s::text[], %s::text[])
)
SELECT
  COUNT(*) FILTER (WHERE r.sinter_feed_value IS DISTINCT FROM source.sinter_feed)::int
    AS records_to_update
  FROM records r
  INNER JOIN source ON source.numero_nota = r.numero_nota
;
"""

APPLY_SQL = """
WITH source(numero_nota, sinter_feed) AS (
  SELECT * FROM unnest(%s::text[], %s::text[])
)
UPDATE records r
SET sinter_feed_value = source.sinter_feed
FROM source
WHERE r.numero_nota = source.numero_nota
  AND r.sinter_feed_value IS DISTINCT FROM source.sinter_feed
RETURNING r.id;
"""

CATALOG_SUMMARY_SQL = """
SELECT COUNT(*)::int
FROM unnest(%s::text[]) AS source(code)
LEFT JOIN sinter_feeds feed ON feed.code = source.code
WHERE feed.id IS NULL;
"""

UPSERT_SINTER_FEEDS_SQL = """
INSERT INTO sinter_feeds (id, code, is_active, created_at, updated_at)
SELECT source.id, source.code, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM unnest(%s::uuid[], %s::text[]) AS source(id, code)
ON CONFLICT (code) DO NOTHING
RETURNING id;
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path, help="Caminho para o CSV separado por ponto e virgula.")
    parser.add_argument("--apply", action="store_true", help="Efetiva a atualizacao. Sem esta opcao, apenas mostra a previa.")
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_FILE,
        help=f"Arquivo .env com DATABASE_URL (padrao: {DEFAULT_ENV_FILE}).",
    )
    parser.add_argument(
        "--allow-any-product",
        action="store_true",
        help="Aceita valores de Produto que nao contenham 'SINTER FEED'.",
    )
    args = parser.parse_args()

    if not args.csv_path.is_file():
        parser.error(f"Arquivo nao encontrado: {args.csv_path}")

    try:
        rows = read_rows(args.csv_path, args.allow_any_product)
    except ValueError as error:
        print(f"Erro ao ler CSV: {error}", file=sys.stderr)
        return 2

    if not rows:
        print("Nenhuma NF com Sinter Feed foi encontrada no CSV.", file=sys.stderr)
        return 2

    database_url = read_database_url(args.env_file)
    if not database_url:
        print(
            "DATABASE_URL nao encontrada no ambiente nem no arquivo "
            f"{args.env_file}.",
            file=sys.stderr,
        )
        return 2

    try:
        import psycopg
    except ImportError:
        print('Dependencia ausente. Execute: python -m pip install "psycopg[binary]>=3.1,<4"', file=sys.stderr)
        return 2

    items = list(rows.items())
    unique_sinter_feeds = sorted(set(rows.values()))
    totals = {"matched": 0, "to_update": 0, "updated": 0, "feeds_to_create": 0, "feeds_created": 0}

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(CATALOG_SUMMARY_SQL, (unique_sinter_feeds,))
                totals["feeds_to_create"] = cursor.fetchone()[0]
                if args.apply:
                    cursor.execute(UPSERT_SINTER_FEEDS_SQL, ([uuid.uuid4() for _ in unique_sinter_feeds], unique_sinter_feeds))
                    totals["feeds_created"] = len(cursor.fetchall())
                for batch in chunks(items):
                    note_numbers, sinter_feeds = zip(*batch)
                    cursor.execute(SUMMARY_SQL, (list(note_numbers), list(sinter_feeds)))
                    (to_update,) = cursor.fetchone()
                    totals["to_update"] += to_update

                    cursor.execute(
                        "SELECT COUNT(*)::int FROM records WHERE numero_nota = ANY(%s::text[])",
                        (list(note_numbers),),
                    )
                    totals["matched"] += cursor.fetchone()[0]

                    if args.apply:
                        cursor.execute(APPLY_SQL, (list(note_numbers), list(sinter_feeds)))
                        totals["updated"] += len(cursor.fetchall())


            if args.apply:
                connection.commit()
            else:
                connection.rollback()
    except Exception as error:
        print(f"Falha na operacao: {error}", file=sys.stderr)
        return 1

    print(f"NFs unicas lidas: {len(rows)}")
    print(f"Registros encontrados no banco: {totals['matched']}")
    print(f"Registros que seriam atualizados: {totals['to_update']}")
    print(f"Sinter Feeds que seriam cadastrados: {totals['feeds_to_create']}")
    if args.apply:
        print(f"Sinter Feeds cadastrados e confirmados: {totals['feeds_created']}")
        print(f"Registros atualizados e confirmados: {totals['updated']}")
    else:
        print("Previa concluida. Nenhuma alteracao foi gravada. Use --apply para efetivar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
