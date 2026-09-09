import { useState } from "react";
import Field, { inputCls } from "./Field";
import { CURRENT_SEMESTER } from "../data/mockData";

export default function CourseForm({ initial, students, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(
    initial ?? { code: "", name: "", semester: CURRENT_SEMESTER, studentIds: [] }
  );
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleStudent = (id) =>
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((studentId) => studentId !== id)
        : [...f.studentIds, id],
    }));

  const validate = () => {
    const next = {};
    if (!form.code.trim()) next.code = "Enter a course code.";
    if (!form.name.trim()) next.name = "Enter a course name.";
    if (!form.semester.trim()) next.semester = "Enter a semester.";
    if (form.studentIds.length === 0) next.studentIds = "Enroll at least one student.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      semester: form.semester.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Course code" error={errors.code}>
          <input className={inputCls} placeholder="CS 450" value={form.code} onChange={set("code")} />
        </Field>
        <Field label="Semester" error={errors.semester}>
          <input className={inputCls} placeholder="Fall 2026" value={form.semester} onChange={set("semester")} />
        </Field>
      </div>

      <Field label="Course name" error={errors.name}>
        <input className={inputCls} placeholder="Advanced Software Engineering" value={form.name} onChange={set("name")} />
      </Field>

      <Field label="Enroll students" error={errors.studentIds}>
        <div className="max-h-56 overflow-y-auto rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)]">
          {students.length === 0 ? (
            <p className="p-3 text-sm text-[var(--color-ink-faint)]">No student accounts exist yet.</p>
          ) : (
            students.map((student) => (
              <label key={student.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b last:border-b-0 border-[var(--color-line-soft)] cursor-pointer hover:bg-[var(--color-paper)]/60">
                <input
                  type="checkbox"
                  checked={form.studentIds.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="accent-[var(--color-navy)]"
                />
                <span className="text-sm text-[var(--color-ink)]">{student.name}</span>
                <span className="ml-auto text-[10px] font-mono text-[var(--color-ink-faint)]">{student.email}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mt-1.5">
          {form.studentIds.length} student{form.studentIds.length !== 1 ? "s" : ""} enrolled
        </p>
      </Field>

      <div className="flex gap-2.5 mt-6">
        <button type="button" onClick={onCancel} className="flex-1 rounded-sm border border-[var(--color-line)] py-2.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)] transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] py-2.5 text-sm font-semibold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
