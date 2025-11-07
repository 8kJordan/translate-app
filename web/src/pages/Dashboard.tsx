import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import { api } from "@/api";

type Lang = { code: string; name: string };

const LANGUAGES_ENDPOINT = "/api/languages";
const TRANSLATE_ENDPOINT = "/api/translate";

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // language + text state
  const [languages, setLanguages] = useState<Lang[]>([]);
  const [from, setFrom] = useState<string>("auto");
  const [to, setTo] = useState<string>("en");
  const [text, setText] = useState<string>("");
  const [result, setResult] = useState<string>("");

  // Fetch languages on mount
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const res = await api<{ status: string; supportedLanguages: Record<string, { name: string; nativeName: string }> }>('/api/languages', { method: 'GET' });

        const langs = Object.entries(res.supportedLanguages)
          .map(([code, info]) => ({
            code,
            name: info.name || info.nativeName || code.toUpperCase(),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // alphabetize once

        setLanguages(langs);
      } catch (e: any) {
        console.error("Failed to load languages:", e);
        setErr(e?.data?.message || "Failed to load languages.");
      }
    })();
  }, []);

  const canTranslate = useMemo(
    () => text.trim().length > 0 && !!to && !loading,
    [text, to, loading]
  );


  async function handleTranslate() {
    if (!canTranslate) return;
    setLoading(true);
    setErr(null);
    setResult("");

    try {
      const payload: Record<string, string> = {
        text: text.trim(),
        to
      };
      // only include 'from' if not auto
      if (from !== "auto") payload.from = from;

      const res = await api<{ translatedText?: string; translation?: string; text?: string }>(
        "/api/translate",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const out =
        res.translatedText ||
        (res as any).result ||
        res.translation ||
        (res as any).data ||
        res.text ||
        "";
      setResult(out);
    } catch (e: any) {
      setErr(e?.data?.message || e?.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    if (from === "auto") return; // avoid swapping auto-detect to target
    setFrom(to);
    setTo(from);
    if (result) {
      setText(result);
      setResult("");
    }
  }

  async function copy(textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // no-op
    }
  }

  async function handleLogout() {
    setErr(null);
    setLogoutLoading(true);
    try {
      await api<{ status: string }>("/api/auth/logout", { method: "GET" });
      onLogout();
      navigate("/", { replace: true });
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.errType || e?.message || "Failed to log out.";
      setErr(msg);
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h2 className="h2">Dashboard</h2>
        <button className="btn btn-gradient" onClick={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {err && <div className="banner" role="alert">{err}</div>}

      {/* Translator panel */}
      <div className="translator-grid">
        <div className="panel">
          <div className="row-space">
            <div className="select-wrap">
              <label className="label">From</label>
              <select className="select" value={from} onChange={e => setFrom(e.target.value)}>
                <option value="auto">Auto-detect</option>
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <button className="link-btn" onClick={swap} title="Swap languages" disabled={from === "auto"}>
              ⇄ Swap
            </button>

            <div className="select-wrap">
              <label className="label">To</label>
              <select className="select" value={to} onChange={e => setTo(e.target.value)}>
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            className="textarea"
            placeholder="Type text to translate…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="row-space tools">
            <span className="muted">{text.length} chars</span>
            <div className="row" style={{ gap: 20 }}>
              <button className="link-btn" onClick={() => setText("")} disabled={!text}>Clear</button>
              <Button loading={loading} onClick={handleTranslate} disabled={!canTranslate}>
                Translate
              </Button>
            </div>
          </div>
        </div>

        <div className="panel">
          <label className="label">Result</label>
          <textarea
            className="textarea"
            placeholder="Translation will appear here…"
            value={result}
            onChange={e => setResult(e.target.value)}
          />
          <div className="row-space tools">
            <span className="muted">{result.length} chars</span>
            <div className="row" style={{ gap: 8 }}>
              <button className="link-btn" onClick={() => copy(result)} disabled={!result}>Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}