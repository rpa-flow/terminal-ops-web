import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { loginRequest } from "../services/auth.service";

export const LoginPage = () => {
  const { token, setSession } = useAuth();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginRequest({ email, password });
      setSession(response.token, response.user);
    } catch {
      setError("Falha ao autenticar. Confira as credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f172a] px-4 py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(circle_at_20%_20%,#22d3ee33,transparent_32%),radial-gradient(circle_at_80%_0%,#a78bfa33,transparent_30%),radial-gradient(circle_at_50%_100%,#f9731630,transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-950/75 p-8 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.45)] backdrop-blur-xl"
      >
        <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-200 uppercase">
          Painel de Operações
        </p>

        <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">Acesso do Operador</h1>
        <p className="mt-2 text-sm text-slate-300">Entre para monitorar e validar dados da automação RPA em tempo real.</p>

        <label className="mt-8 block text-xs font-medium tracking-[0.14em] text-slate-300 uppercase">Email</label>
        <input className="input mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="mt-5 block text-xs font-medium tracking-[0.14em] text-slate-300 uppercase">Senha</label>
        <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button className="btn-primary mt-7 w-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
};
