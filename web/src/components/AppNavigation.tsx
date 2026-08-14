import { Link, useNavigate } from "react-router-dom";

type AppNavigationProps = {
  current: "records" | "notes" | "reports" | "shipments";
  reportArea?: "tbjc" | "tcs";
};

export const AppNavigation = ({ current, reportArea }: AppNavigationProps) => {
  const navigate = useNavigate();
  const selectedArea = current === "notes" || reportArea === "tcs" ? "tcs" : "tbjc";
  const navigateToArea = (area: "tbjc" | "tcs") => {
    if (current === "shipments") {
      navigate(`/embarques/${area}`);
      return;
    }

    if (current === "reports") {
      navigate(`/relatorios/${area}`);
      return;
    }

    navigate(area === "tbjc" ? "/" : "/notas");
  };

  return (
    <aside className="app-sidebar" aria-label="Navegação principal">
      <div className="mb-8 flex items-center gap-3 md:mb-8">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-sm font-bold text-on-secondary">MM</span>
        <div>
          <p className="text-sm font-semibold tracking-wide">Minas Mineração</p>
          <p className="text-xs text-primary-container">Operações</p>
        </div>
      </div>
      <nav className="grid gap-3 md:gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-primary-container" htmlFor="terminal-navigation">
            Área operacional
          </label>
          <select
            id="terminal-navigation"
            className="w-full rounded-lg border border-primary-container/40 bg-on-primary/10 px-3 py-2 font-medium text-on-primary outline-none focus:ring-2 focus:ring-secondary"
            value={selectedArea}
            onChange={(event) => navigateToArea(event.target.value as "tbjc" | "tcs")}
            aria-label="Selecionar terminal"
          >
            <option value="tbjc">TBJC — Registros</option>
            <option value="tcs">TCS — Notas</option>
          </select>
        </div>
        <Link
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${current === "reports" ? "bg-on-primary text-primary" : "text-on-primary hover:bg-on-primary/10"}`}
          to={`/relatorios/${selectedArea}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Relatórios
        </Link>
        <Link
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${current === "shipments" ? "bg-on-primary text-primary" : "text-on-primary hover:bg-on-primary/10"}`}
          to={`/embarques/${selectedArea}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Embarques
        </Link>
      </nav>
    </aside>
  );
};
