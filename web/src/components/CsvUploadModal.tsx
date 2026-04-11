import { useRef, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { uploadCsvRequest } from "../services/records.service";
import type { CsvUploadResponse } from "../types/api";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export const CsvUploadModal = ({ onClose, onSuccess }: Props) => {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file || !token) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadCsvRequest(token, file);
      setResult(response);
      if (response.inserted > 0) onSuccess();
    } catch {
      setError("Falha ao importar o CSV. Verifique o arquivo e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Importar CSV</h2>
        <p className="mb-4 text-sm text-slate-500">
          O arquivo deve ter as colunas na ordem abaixo (com cabeçalho):
        </p>
        <div className="mb-4 overflow-x-auto rounded bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
          dataHora, numeroNota, notaOriginal, status, motoristaNome, motoristaCelular, placa, terminal
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Limite: 500 linhas por envio. dataHora no formato ISO-8601 (ex: 2024-01-15T10:30:00).
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
          />

          {error && <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p>}

          {result && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-green-700">{result.inserted} registro(s) importado(s) com sucesso.</p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 font-medium text-red-600">{result.errors.length} linha(s) com erro:</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {result.errors.map((err) => (
                      <li key={err.row} className="text-red-500">
                        Linha {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-muted" onClick={onClose}>
              Fechar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Importando..." : "Importar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
