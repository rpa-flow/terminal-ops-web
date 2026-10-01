import type { RecordItem } from "../types/api";
import { formatIncomingDateTime } from "../utils/dateTime";

type Props = {
  items: RecordItem[];
  loading: boolean;
};

export const RecordsTable = ({ items, loading }: Props) => {
  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Registros encontrados</h2>
          <p id="records-table-hint" className="mt-0.5 text-sm text-on-surface-variant">Deslize horizontalmente para consultar todas as colunas.</p>
        </div>
        {loading && <span className="text-sm font-medium text-on-surface-variant" role="status">Atualizando lista…</span>}
      </div>
      <div className="overflow-x-auto" aria-busy={loading} aria-describedby="records-table-hint">
      <table className="min-w-[1000px] w-full text-left text-sm">
        <caption className="sr-only">Registros RPA recebidos no terminal.</caption>
        <thead className="bg-surface text-on-surface-variant">
          <tr>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Data/hora</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">NF recebida</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">NF substituída</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold">Peso</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Fornecedor</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Motorista</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Placa</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Sinter Feed</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Blend</th>
          </tr>
        </thead>
        <tbody>
          {loading && items.length === 0 && Array.from({ length: 6 }, (_, index) => (
            <tr key={index} className="border-t border-surface-container-high">
              <td className="px-4 py-3" colSpan={9}><span className="block h-4 animate-pulse rounded bg-surface-container-low" /></td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-center" colSpan={9}>
                <p className="font-medium text-on-surface">Nenhum registro encontrado</p>
                <p className="mt-1 text-sm text-on-surface-variant">Ajuste ou limpe os filtros para ampliar a busca.</p>
              </td>
            </tr>
          )}
          {items.map((record) => (
            <tr key={record.id} className="border-t border-surface-container-high transition-colors hover:bg-surface-container-low focus-within:bg-surface-container-low">
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatIncomingDateTime(record.dataHora)}</td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{record.numeroNota}</td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{record.notaOriginal}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{record.recebimentoPeso ?? "-"}</td>
              <td className="px-4 py-3">{record.emitenteFornecedor ?? "-"}</td>
              <td className="px-4 py-3">{record.motoristaNome ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-3">{record.placa ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-3">{record.sinterFeed ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-3">{record.blend ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
