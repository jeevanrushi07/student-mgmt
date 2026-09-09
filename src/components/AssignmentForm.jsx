import { useState } from "react";
import Field, { inputCls } from "./Field";
import { toDatetimeLocalValue } from "../utils/date";

export default function AssignmentForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(
    initial ?? {
      title: "",
      description: "",
      deadline: toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      oneDriveLink: "",
      submissionType: "individual",
    }
  );
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Give the assignment a title.";
    if (!form.description.trim()) next.description = "A short description helps students know what's expected.";
    if (!form.deadline) next.deadline = "Set a deadline.";
    if (!/^https?:\/\/.+/.test(form.oneDriveLink)) next.oneDriveLink = "Paste a valid OneDrive link (starting with http/https).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, deadline: new Date(form.deadline).toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field label="Title" error={errors.title}>
        <input className={inputCls} placeholder="Assignment 2 — Hash Maps" value={form.title} onChange={set("title")} />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          className={inputCls + " min-h-[92px] resize-y"}
          placeholder="What should students do, and how will it be evaluated?"
          value={form.description}
          onChange={set("description")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Deadline" error={errors.deadline}>
          <input type="datetime-local" className={inputCls} value={form.deadline} onChange={set("deadline")} />
        </Field>
        <Field label="Submission type">
          <div className="flex rounded-sm border border-[var(--color-line)] overflow-hidden">
            {["individual", "group"].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setForm((f) => ({ ...f, submissionType: type }))}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                  form.submissionType === type
                    ? "bg-[var(--color-navy)] text-[var(--color-paper-2)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="OneDrive link" error={errors.oneDriveLink}>
        <input className={inputCls} placeholder="https://onedrive.live.com/…" value={form.oneDriveLink} onChange={set("oneDriveLink")} />
      </Field>

      <div className="flex gap-2.5 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-sm border border-[var(--color-line)] py-2.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] py-2.5 text-sm font-semibold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
