import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field, { inputCls } from "../components/Field";
import { AuthShell } from "./Login";

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await register(form);
      notify(`Account created. Welcome, ${user.name.split(" ")[0]}.`, "success");
      navigate(user.role === "professor" ? "/professor" : "/student");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join the ledger"
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="text-[var(--color-brass-dark)] font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" error={errors.name}>
          <input className={inputCls} placeholder="Jordan Blake" value={form.name} onChange={set("name")} autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className={inputCls} placeholder="you@college.edu" value={form.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" className={inputCls} placeholder="At least 6 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
        </Field>

        <Field label="I am a">
          <div className="grid grid-cols-2 gap-2.5">
            {["student", "professor"].map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => setForm((f) => ({ ...f, role }))}
                className={`rounded-sm border py-2.5 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                  form.role === role
                    ? "border-[var(--color-brass)] bg-[var(--color-brass-tint)] text-[var(--color-brass-dark)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </Field>

        {formError && (
          <p className="mb-4 text-sm text-[var(--color-stamp-red)] bg-[var(--color-stamp-red-tint)] border border-[var(--color-stamp-red)]/30 rounded-sm px-3 py-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold py-2.5 hover:bg-[var(--color-navy-2)] transition-colors disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
