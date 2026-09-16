import type { RecordItem } from "../types/api";
import { formatIncomingDateTime } from "../utils/dateTime";

export const RecordsTable = ({ items }: { items: RecordItem[] }) => {
  return (
    <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-on-surface-variant">
          <tr>
            <th className="px-4 py-3">Data/Hora</th>
            <th className="px-4 py-3">NF Recebida</th>
            <th className="px-4 py-3">NF Substituída</th>
            <th className="px-4 py-3">Peso</th>
            <th className="px-4 py-3">Fornecedor</th>
            <th className="px-4 py-3">Motorista</th>
            <th className="px-4 py-3">Placa</th>
            <th className="px-4 py-3">Sinter Feed</th>
            <th className="px-4 py-3">Blend</th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr key={record.id} className="border-t border-surface-container-high">
              <td className="px-4 py-3">{formatIncomingDateTime(record.dataHora)}</td>
              <td className="px-4 py-3">{record.numeroNota}</td>
              <td className="px-4 py-3">{record.notaOriginal}</td>
              <td className="px-4 py-3">{record.recebimentoPeso ?? "-"}</td>
              <td className="px-4 py-3">{record.emitenteFornecedor ?? "-"}</td>
              <td className="px-4 py-3">{record.motoristaNome ?? "-"}</td>
              <td className="px-4 py-3">{record.placa}</td>
              <td className="px-4 py-3">{record.sinterFeed ?? "-"}</td>
              <td className="px-4 py-3">{record.blend ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Sem registros para os filtros aplicados.</p>}
    </div>
  );
};
