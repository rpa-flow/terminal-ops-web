export const formatIncomingDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return value;
  }

  const [, year, month, day, hour, minute, second] = match;
  const time = second ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
  return `${day}/${month}/${year} ${time}`;
};

export const formatBrazilianDateInput = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

export const parseBrazilianDateInput = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() !== Number(month) - 1 ||
    candidate.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};
