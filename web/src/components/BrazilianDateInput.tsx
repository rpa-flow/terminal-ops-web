import { useEffect, useState } from "react";

import { formatBrazilianDateInput, parseBrazilianDateInput } from "../utils/dateTime";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label: string;
  required?: boolean;
};

export const BrazilianDateInput = ({ value, onChange, className, label, required = false }: Props) => {
  const [displayValue, setDisplayValue] = useState(() => formatBrazilianDateInput(value));

  useEffect(() => {
    setDisplayValue(formatBrazilianDateInput(value));
  }, [value]);

  const validate = (input: HTMLInputElement) => {
    if (!input.value || parseBrazilianDateInput(input.value)) {
      input.setCustomValidity("");
      return true;
    }

    input.setCustomValidity("Informe a data no formato DD/MM/AAAA.");
    return false;
  };

  return (
    <input
      aria-label={label}
      className={className}
      inputMode="numeric"
      maxLength={10}
      onBlur={(event) => {
        if (validate(event.currentTarget)) {
          const normalized = parseBrazilianDateInput(event.currentTarget.value);
          if (normalized) setDisplayValue(formatBrazilianDateInput(normalized));
        }
      }}
      onChange={(event) => {
        const nextValue = event.target.value;
        setDisplayValue(nextValue);
        event.currentTarget.setCustomValidity("");
        const normalized = parseBrazilianDateInput(nextValue);
        if (normalized || !nextValue) onChange(normalized ?? "");
      }}
      placeholder="DD/MM/AAAA"
      required={required}
      type="text"
      value={displayValue}
    />
  );
};
