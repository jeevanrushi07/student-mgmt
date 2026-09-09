import { useState } from "react";
import Field, { inputCls } from "./Field";

export default function CourseForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState({ code: "", name: "", semester: "Fall 2026" });
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.semester.trim()) {
      setError("Complete all fields.");
      return;
    }
    setError("");
    try { await onSubmit(form); } catch (err) { setError(err.message); }
  };

  return (
    <form onSubmit={submit}>
      <Field label="Course code">
        <input className={inputCls} placeholder="CS 501" value={form.code} onChange={set("code")} autoFocus />
      </Field>
      <Field label="Course name">
        <input className={inputCls} placeholder="Advanced Software Engineering" value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Semester">
        <input className={inputCls} placeholder="Fall 2026" value={form.semester} onChange={set("semester")} />
      </Field>
      {error && <p className="text-sm text-[var(--color-stamp-red)] mb-3">{error}</p>}
      <div className="flex gap-2.5 mt-6">
        <button type="button" onClick={onCancel} className="flex-1 rounded-sm border border-[var(--color-line)] py-2.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)] cursor-pointer">Cancel</button>
        <button type="submit" className="flex-1 rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] py-2.5 text-sm font-semibold hover:bg-[var(--color-navy-2)] cursor-pointer">Create course</button>
      </div>
    </form>
  );
}
