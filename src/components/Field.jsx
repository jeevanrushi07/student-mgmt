export default function Field({ label, error, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
        {label}
      </span>
      {children}
      {error && <span className="block mt-1 text-xs text-[var(--color-stamp-red)]">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-brass)] outline-none transition-colors";
