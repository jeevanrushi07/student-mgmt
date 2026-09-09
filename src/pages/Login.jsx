import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field, { inputCls } from "../components/Field";

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form);
      notify(`Welcome back, ${user.name.split(" ")[0]}.`, "success");
      navigate(user.role === "professor" ? "/professor" : "/student");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back to the ledger"
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-[var(--color-brass-dark)] font-semibold hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className={inputCls}
            placeholder="you@college.edu"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            className={inputCls}
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            autoComplete="current-password"
          />
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
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-5 rounded-sm border border-dashed border-[var(--color-line)] px-3 py-2.5 text-xs text-[var(--color-ink-faint)] font-mono leading-relaxed">
          Demo password for all accounts: password
          <br />
          Professor — anita.rao@college.edu (Professor)
          <br />
          Students:
          <br />
          priya.sharma@college.edu (Student · Group Leader)
          <br />
          rohan.verma@college.edu (Student · Group Member)
          <br />
          aditi.nair@college.edu (Student · Group Leader)
          <br />
          kabir.singh@college.edu (Student · Group Member)
          <br />
          meera.iyer@college.edu (Student · Ungrouped)
          <br />
          devansh.gupta@college.edu (Student · Ungrouped)
          <br />
          Use different student accounts to demonstrate leader, member, and ungrouped states.
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ eyebrow, title, children, footer }) {
  return (
    <div className="min-h-screen paper-texture flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-11 h-11 grid place-items-center rounded-sm bg-[var(--color-navy)] text-[var(--color-brass-tint)] font-display text-2xl">
            §
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-brass-dark)] mb-2">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl text-[var(--color-ink)]">{title}</h1>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-7 shadow-sm">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-[var(--color-ink-soft)] mt-5">{footer}</p>
        )}
      </div>
    </div>
  );
}
