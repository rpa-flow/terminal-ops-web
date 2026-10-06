import { useEffect, useState } from "react";
import { formatBrazilianDateInput, parseBrazilianDateInput } from "../utils/dateTime";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
};

export const BrazilianDateInput = ({ value, onChange, className, label, required = false, disabled = false }: Props) => {
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
      onBlur={(event) => validate(event.currentTarget)}
      onChange={(event) => {
        const input = event.currentTarget;
        const nextValue = input.value;
        setDisplayValue(nextValue);

        if (!validate(input)) {
          return;
        }

        onChange(nextValue ? parseBrazilianDateInput(nextValue)! : "");
      }}
      required={required}
      disabled={disabled}
      type="text"
      value={displayValue}
    />
  );
};
