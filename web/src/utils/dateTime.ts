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
