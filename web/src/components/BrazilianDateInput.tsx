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
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      type="text"
      value={displayValue}
    />
  );
};
