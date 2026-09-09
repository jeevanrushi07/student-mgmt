import { useEffect } from "react";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-navy)]/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative fade-up w-full max-w-lg rounded-md bg-[var(--color-paper-2)] border border-[var(--color-line)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)]">
          <h2 className="font-display text-lg text-[var(--color-ink)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 grid place-items-center rounded-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line-soft)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
