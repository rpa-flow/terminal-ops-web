import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { loginRequest } from "../services/auth.service";

export const LoginPage = () => {
  const { token, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_20%,#d9e2ff,transparent_30%),radial-gradient(circle_at_80%_0%,#9ef2e2,transparent_25%),#f8f9ff] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Minas Mineração</p>
        <h1 className="text-[22px] font-medium text-on-surface">Acesso do Operador</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Entre para visualizar dados de automação RPA.</p>

        <label className="mt-6 block text-sm text-on-surface-variant" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input mt-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seuemail@empresa.com"
          autoComplete="email"
          required
        />

        <label className="mt-4 block text-sm text-on-surface-variant" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          className="input mt-1"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          required
        />

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
};
