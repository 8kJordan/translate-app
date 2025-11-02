import Button from "@/components/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogout() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ status: string }>("/api/auth/logout", { method: "GET" });
      onLogout();
      navigate("/", { replace: true });
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.errType || e?.message || "Failed to log out.";
      setErr(msg); // you'll see 404/500/etc
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="container">
      <header className="header">
        <h2 className="h2">Dashboard</h2>
        <button className="btn btn-gradient" onClick={handleLogout} disabled={loading}>
          {loading ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {err && <div className="banner">{err}</div>}
      <p>You're signed in. Dashboard in progress.</p>
    </div>
  );
}