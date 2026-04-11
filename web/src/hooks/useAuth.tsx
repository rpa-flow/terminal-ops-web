import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { meRequest } from "../services/auth.service";

type AuthUser = {
  id: string;
  email: string;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = "rpa_token";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    meRequest(token)
      .then((response) => {
        setUser({ id: response.user.userId, email: response.user.email });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      loading,
      setSession: (sessionToken, sessionUser) => {
        localStorage.setItem(TOKEN_KEY, sessionToken);
        setToken(sessionToken);
        setUser(sessionUser);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
