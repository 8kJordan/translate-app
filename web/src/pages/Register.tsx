import { FormEvent, useState } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import Button from "@/components/Button";
import Banner from "@/components/Banner";
import GlassCard from "@/components/GlassCard";
import { api, RegisterPayload } from "@/api";
import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Field2 from "@/components/Field2";

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

  // NEW: holds messages from Zod (e.g., password rules)
  const [passwordIssues, setPasswordIssues] = useState<string[]>([]);

  function set<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPasswordIssues([]); // clear old schema errors
    setLoading(true);

    try {
      const res = await api<{ status: string; message?: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(form) }
      );
      setMessage(res.message || "Check your inbox for a verification email.");
    } catch (err: any) {
      const data = err?.data;

      // If backend sent Zod issues, surface them
      if (data?.errType === "SchemaValidationErr" && Array.isArray(data.errors)) {
        const messages = data.errors
          .filter((e: any) => Array.isArray(e.field) && e.field[0] === "password")
          .map((e: any) => e.message)
          .filter(Boolean);

        if (messages.length) {
          setPasswordIssues(messages);
          setError("Please fix the password requirements.");
        } else {
          setError(data?.message || "Invalid input.");
        }
      } else {
        setError(data?.desc || data?.message || err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero">
      <GlassCard style={{ width: "clamp(280px, 92vw, 520px)" }}>
        <h2 className="h2">Create account</h2>
        <p className="muted">We’ll send you a verification email.</p>

        {message && <Banner message={message} />}
        {error && <Banner message={error} />}

        <form onSubmit={handleSubmit} className="vstack">
          <div className="row-space">
            <Field2
              label="First name"
              value={form.firstName || ""}
              onChange={(e) => set("firstName", e.currentTarget.value)}
              placeholder="First name"
              required
            />
            <Field2
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
            onChange={(e) => {
              set("password", e.currentTarget.value);
              // clear messages as user edits password
              if (passwordIssues.length) setPasswordIssues([]);
            }}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />

          {/* Show Zod password schema messages here */}
          {passwordIssues.length > 0 && (
            <ul className="error" style={{ marginTop: 6, paddingLeft: 18 }}>
              {passwordIssues.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}

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
            <Link to="/" className="accent-link">Return to login</Link>
          </p>

          <Button loading={loading} type="submit">Create account</Button>
        </form>
      </GlassCard>
    </div>
  );
}
