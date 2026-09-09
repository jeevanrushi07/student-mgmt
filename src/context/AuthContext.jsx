import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "ledger.session.v4";
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function authRequest(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.message || "Authentication failed.");
  return payload;
}

export function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.token && decodeJwt(parsed.token)?.exp * 1000 > Date.now()) return parsed;
    } catch {}
    return null;
  });

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const login = async (credentials) => {
    const result = await authRequest("/auth/login", credentials);
    setSession(result);
    return result.user;
  };

  const register = async (data) => {
    const result = await authRequest("/auth/register", data);
    setSession(result);
    return result.user;
  };

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
