import { FormEvent, useState } from "react";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import { api, LoginPayload } from "@/api";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import Button from "@/components/Button";
import { Mail } from "lucide-react";
import Banner from "@/components/Banner";
import { Link } from "react-router-dom";


function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

export default function Login({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const payload: LoginPayload = { email, password };
      const res = await api<{ status: string; isAuthenticated: boolean }>(
        "/api/auth",
        { method: "POST", body: JSON.stringify(payload) }
      );
      if (res.isAuthenticated) {
        onAuthed();
        navigate("/app", { replace: true });
      } else {
        setError("Login failed.");
      }
    } catch (err: any) {
      setError(err?.data?.desc || err?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero">
      <GlassCard style={{ minWidth: 380, maxWidth: 520, width: "100%" }}>
        <h2 className="h2">Welcome back</h2>
        <p className="muted">Sign in to continue.</p>
        {error && <Banner message={error} />}
        <form onSubmit={handleSubmit} className="vstack">
          <div className="with-icon">
            <Mail className="icon" size={18} />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Not a member?{" "}
            <Link to="/register" className="accent-link">
              Register here
            </Link>
          </p>

          <Button loading={loading} type="submit" aria-label="Sign in">
            Sign In
          </Button>

        </form>
      </GlassCard>
    </div>
  );
}
