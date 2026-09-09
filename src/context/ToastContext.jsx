import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, variant = "default") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-animate max-w-sm rounded-md border px-4 py-3 shadow-lg text-sm font-medium
              ${t.variant === "success" ? "bg-[var(--color-stamp-green-tint)] border-[var(--color-stamp-green)] text-[var(--color-stamp-green)]" : ""}
              ${t.variant === "error" ? "bg-[var(--color-stamp-red-tint)] border-[var(--color-stamp-red)] text-[var(--color-stamp-red)]" : ""}
              ${t.variant === "default" ? "bg-[var(--color-navy)] border-[var(--color-navy)] text-[var(--color-paper-2)]" : ""}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
