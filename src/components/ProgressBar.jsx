export default function ProgressBar({ value, total, label }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--color-ink-soft)]">{label}</span>
          <span className="text-xs font-mono text-[var(--color-ink-faint)]">
            {value}/{total}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-[var(--color-line-soft)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-brass)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
