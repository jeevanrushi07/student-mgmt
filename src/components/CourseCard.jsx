import { Link } from "react-router-dom";

export default function CourseCard({ course, stat }) {
  return (
    <Link
      to={`/course/${course.id}`}
      className="group fade-up block rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-brass)] hover:shadow-[0_4px_18px_-6px_rgba(30,42,68,0.18)] transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--color-brass-dark)] bg-[var(--color-brass-tint)] px-2 py-1 rounded-sm">
          {course.code}
        </span>
        <span className="text-[var(--color-ink-faint)] text-lg group-hover:translate-x-0.5 group-hover:text-[var(--color-brass)] transition-all">
          &rarr;
        </span>
      </div>
      <h3 className="font-display text-xl text-[var(--color-ink)] leading-snug mb-1.5">
        {course.name}
      </h3>
      <p className="text-sm text-[var(--color-ink-faint)] mb-4">{course.semester}</p>
      {stat && (
        <p className="text-sm text-[var(--color-ink-soft)] border-t border-[var(--color-line-soft)] pt-3">
          {stat}
        </p>
      )}
    </Link>
  );
}
