import { Link } from "react-router-dom";

type AppNavigationProps = {
  current: "records" | "notes" | "reports";
};

export const AppNavigation = ({ current }: AppNavigationProps) => {
  const linkClass = (isActive: boolean) =>
    isActive
      ? "rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white"
      : "btn-muted";

  return (
    <nav className="flex items-center gap-2" aria-label="Navegacao principal">
      <Link className={linkClass(current === "records")} to="/">
        Registros
      </Link>
      <Link className={linkClass(current === "notes")} to="/notas">
        Notas
      </Link>
      <Link className={linkClass(current === "reports")} to="/relatorios">
        Relatórios
      </Link>
    </nav>
  );
};
