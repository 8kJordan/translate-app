import { FormEvent, useState } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import Button from "@/components/Button";
import Banner from "@/components/Banner";
import GlassCard from "@/components/GlassCard";
import { api, RegisterPayload } from "@/api";
import { Mail } from "lucide-react";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState<RegisterPayload>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RegisterPayload>(
    key: K,
    value: RegisterPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api<{ status: string; message?: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(form) }
      );
      setMessage(
        res.message || "Check your inbox for a verification email."
      );
    } catch (err: any) {
      setError(
        err?.data?.desc ||
        err?.data?.message ||
        err.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero">
      <GlassCard style={{ minWidth: 380, maxWidth: 520, width: "100%" }}>
        <h2 className="h2">Create account</h2>
        <p className="muted">We’ll send you a verification email.</p>

        {message && <Banner message={message} />}
        {error && <Banner message={error} />}

        <form onSubmit={handleSubmit} className="vstack">
          <div className="row-space" style={{ gap: 12 }}>
            <Field
              label="First name"
              value={form.firstName || ""}
              onChange={(e) => set("firstName", e.currentTarget.value)}
              placeholder="First name"
              required
            />
            <Field
              label="Last name"
              value={form.lastName || ""}
              onChange={(e) => set("lastName", e.currentTarget.value)}
              placeholder="Last name"
              required
            />
          </div>

          <div className="with-icon">
            <Mail className="icon" size={18} />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.currentTarget.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <PasswordField
            label="Password"
            value={form.password}
            onChange={(e) => set("password", e.currentTarget.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />

          <div className="with-icon">
            <Phone className="icon" size={18} />
            <Field
              label="Phone"
              value={(form as any).phone || ""}
              onChange={(e) => set("phone", e.currentTarget.value as any)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Already have an account?{" "}
            <Link to="/" className="accent-link">
              Return to login
            </Link>
          </p>

          <Button loading={loading} type="submit">Create account</Button>
        </form>
      </GlassCard>
    </div>
  );
}
