import { Link, useNavigate } from "react-router-dom";

type AppNavigationProps = {
  current: "records" | "notes" | "reports";
};

export const AppNavigation = ({ current }: AppNavigationProps) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-2" aria-label="Navegação principal">
      <label className="sr-only" htmlFor="terminal-navigation">Terminal selecionado</label>
      <select
        id="terminal-navigation"
        className="input min-w-44 font-medium"
        value={current === "reports" ? "" : current}
        onChange={(event) => navigate(event.target.value === "records" ? "/" : "/notas")}
        aria-label="Selecionar terminal"
      >
        {current === "reports" && <option value="" disabled>Selecionar terminal</option>}
        <option value="records">Terminal TBJC</option>
        <option value="notes">Terminal TCS</option>
      </select>
      <Link
        className={current === "reports" ? "rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white" : "btn-muted"}
        to="/relatorios"
      >
        Relatórios
      </Link>
    </nav>
  );
};
