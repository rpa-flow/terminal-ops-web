import type { RecordItem } from "../types/api";

export const RecordsTable = ({ items }: { items: RecordItem[] }) => {
  const formatWithThreeHourOffset = (value: string) => {
    const adjusted = new Date(new Date(value).getTime() + 3 * 60 * 60 * 1000);
    return adjusted.toLocaleString("pt-BR");
  };

  return (
    <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-on-surface-variant">
          <tr>
            <th className="px-4 py-3">Data/Hora</th>
            <th className="px-4 py-3">NF Recebida</th>
            <th className="px-4 py-3">NF Substituída</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Motorista</th>
            <th className="px-4 py-3">Celular do motorista</th>
            <th className="px-4 py-3">Placa</th>
            <th className="px-4 py-3">Terminal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr key={record.id} className="border-t border-surface-container-high">
              <td className="px-4 py-3">{formatWithThreeHourOffset(record.dataHora)}</td>
              <td className="px-4 py-3">{record.numeroNota}</td>
              <td className="px-4 py-3">{record.notaOriginal}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-secondary-container px-2 py-1 text-xs font-medium text-on-secondary-container">{record.status}</span>
              </td>
              <td className="px-4 py-3">{record.motoristaNome}</td>
              <td className="px-4 py-3">{record.motoristaCelular}</td>
              <td className="px-4 py-3">{record.placa}</td>
              <td className="px-4 py-3">{record.terminal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Sem registros para os filtros aplicados.</p>}
    </div>
  );
};
