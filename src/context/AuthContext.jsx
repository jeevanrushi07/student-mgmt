import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "ledger.session.v4";

async function api(action, body) {
  const response = await fetch(`/api/index.js?action=${encodeURIComponent(action)}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(true);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const login = async ({ email, password }) => {
    const data = await api("login", { email, password });
    setSession(data);
    return data.user;
  };

  const register = async ({ name, email, password, role }) => {
    const data = await api("register", { name, email, password, role });
    setSession(data);
    return data.user;
  };

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, authReady, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
