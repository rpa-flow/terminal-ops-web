type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
};

export const BrazilianDateInput = ({ value, onChange, className, label, required = false, disabled = false }: Props) => {
  return (
    <input
      aria-label={label}
      className={className}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      type="date"
      value={value}
    />
  );
};
