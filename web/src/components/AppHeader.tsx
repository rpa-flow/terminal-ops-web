import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export const AppHeader = ({ title, subtitle, actions }: Props) => {
  return (
    <header className="border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 className="text-[22px] font-medium text-on-surface">{title}</h1>
          {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
};

export const HeaderLinkButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link className="btn-muted" to={to}>
    {children}
  </Link>
);
