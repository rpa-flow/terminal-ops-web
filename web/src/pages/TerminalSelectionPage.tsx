import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const terminals = [
  {
    code: "TBJC",
    description: "Acesse o painel de registros e acompanhe as operações do terminal.",
    label: "Terminal TBJC",
    to: "/",
  },
  {
    code: "TCS",
    description: "Consulte as notas pendentes e os dados operacionais do terminal.",
    label: "Terminal TCS",
    to: "/notas",
  },
];

export const TerminalSelectionPage = () => {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#dbeafe,transparent_28%),radial-gradient(circle_at_85%_15%,#e0e7ff,transparent_24%),#f8fafc]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-sky-700">Terminal Ops</p>
            <p className="text-sm text-slate-500">Operador: {user?.email}</p>
          </div>
          <button className="btn-muted" onClick={logout}>Sair</button>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 sm:py-24">
        <div className="max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">Visão operacional</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Qual terminal você deseja visualizar?</h1>
          <p className="mt-3 text-base text-slate-600">Selecione um terminal para acessar os dados correspondentes.</p>
        </div>

        <div className="mt-10 grid w-full gap-5 md:grid-cols-2">
          {terminals.map((terminal) => (
            <Link
              key={terminal.code}
              to={terminal.to}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-sm font-bold text-sky-800">{terminal.code}</span>
                <span className="text-2xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-700" aria-hidden="true">→</span>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-slate-900">{terminal.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{terminal.description}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-sky-700">Acessar terminal</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};
