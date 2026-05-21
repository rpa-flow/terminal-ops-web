import type { RecordItem } from "../types/api";

export const RecordsTable = ({ items }: { items: RecordItem[] }) => {
  const formatWithThreeHourOffset = (value: string) => {
    const adjusted = new Date(new Date(value).getTime() + 3 * 60 * 60 * 1000);
    return adjusted.toLocaleString("pt-BR");
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">Data/Hora</th>
            <th className="px-4 py-3">NF Recebida</th>
            <th className="px-4 py-3">NF Substituida</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">ID NF Pesagem</th>
            <th className="px-4 py-3">Motorista</th>
            <th className="px-4 py-3">Celular motorista</th>
            <th className="px-4 py-3">Placa</th>
            <th className="px-4 py-3">Terminal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr key={record.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{formatWithThreeHourOffset(record.dataHora)}</td>
              <td className="px-4 py-3">{record.numeroNota}</td>
              <td className="px-4 py-3">{record.notaOriginal}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{record.status}</span>
              </td>
              <td className="px-4 py-3">{record.notaPesagemId}</td>
              <td className="px-4 py-3">{record.motoristaNome}</td>
              <td className="px-4 py-3">{record.motoristaCelular}</td>
              <td className="px-4 py-3">{record.placa}</td>
              <td className="px-4 py-3">{record.terminal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-4 text-sm text-slate-500">Sem registros para os filtros aplicados.</p>}
    </div>
  );
};
