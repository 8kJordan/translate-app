import { FormEvent, useState } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import Button from "@/components/Button";
import Banner from "@/components/Banner";
import GlassCard from "@/components/GlassCard";
import { Mail } from "lucide-react";
import { api, RegisterPayload } from "@/api";

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
              placeholder="Sam"
              required
            />
            <Field
              label="Last name"
              value={form.lastName || ""}
              onChange={(e) => set("lastName", e.currentTarget.value)}
              placeholder="N"
              required
            />
          </div>

          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.currentTarget.value)}
            required
            placeholder="you@example.com"
          />

          <PasswordField
            label="Password"
            value={form.password}
            onChange={(e) => set("password", e.currentTarget.value)}
            placeholder="password"
            autoComplete="new-password"
            required
          />

          <Field
            label="Phone (optional)"
            value={form.phone || ""}
            onChange={(e) => set("phone", e.currentTarget.value)}
            placeholder="+1 111 111 1111"
          />

          <Button loading={loading} type="submit">
            Create account
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
