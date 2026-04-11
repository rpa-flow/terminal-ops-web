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
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_30%),radial-gradient(circle_at_80%_0%,#fef3c7,transparent_25%),#f8fafc] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Acesso do Operador</h1>
        <p className="mt-1 text-sm text-slate-500">Entre para visualizar dados de automacao RPA.</p>

        <label className="mt-6 block text-sm text-slate-700">Email</label>
        <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="mt-4 block text-sm text-slate-700">Senha</label>
        <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
};
