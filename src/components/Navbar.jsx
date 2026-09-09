import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { decodeJwt, useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [jwtOpen, setJwtOpen] = useState(false);
  const jwtRef = useRef(null);

  useEffect(() => {
    if (!jwtOpen) return;

    const handleOutsideClick = (event) => {
      if (jwtRef.current && !jwtRef.current.contains(event.target)) {
        setJwtOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setJwtOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [jwtOpen]);

  const home = user?.role === "professor" ? "/professor" : "/student";
  const claims = decodeJwt(token);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-paper-2)]/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to={home} className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-8 h-8 rounded-sm bg-[var(--color-navy)] text-[var(--color-brass-tint)] font-display text-lg">
            §
          </span>
          <span className="font-display text-xl tracking-tight text-[var(--color-ink)]">
            Ledger
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-[var(--color-ink)]">{user.name}</span>
              <span className="text-[11px] uppercase tracking-wider font-mono text-[var(--color-ink-faint)]">
                {user.role}
              </span>
            </div>
            {token && (
              <div ref={jwtRef} className="relative hidden md:block">
                <button
                  type="button"
                  aria-expanded={jwtOpen}
                  aria-haspopup="dialog"
                  onClick={() => setJwtOpen((open) => !open)}
                  className="rounded-sm border border-[var(--color-line)] px-3 py-1.5 text-xs font-mono font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)]"
                >
                  JWT demo
                </button>
                {jwtOpen && (
                  <div className="absolute right-0 mt-2 w-96 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-lg z-50">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-brass-dark)] mb-2">
                    JWT authentication flow
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed mb-3">
                    Login creates a JWT-shaped access token. The session stores it in localStorage, ProtectedRoute checks the authenticated user, and logout removes the session. In production, the server signs and verifies the token.
                  </p>
                  <div className="rounded-sm bg-[var(--color-paper)] border border-[var(--color-line-soft)] p-3 mb-3">
                    <p className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] mb-1">Claims</p>
                    <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-all text-[var(--color-ink-soft)]">
{JSON.stringify(claims, null, 2)}
                    </pre>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mb-1">Token stored in localStorage</p>
                  <code className="block text-[10px] leading-relaxed break-all text-[var(--color-ink-soft)]">
                    {token}
                  </code>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm font-medium px-3.5 py-1.5 rounded-sm border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)] transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
