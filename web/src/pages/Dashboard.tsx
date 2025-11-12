import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import { api } from "@/api";
import { ArrowRight } from "lucide-react";

type Lang = { code: string; name: string };

type UserSafe = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
};

type TranslationItem = {
  _id: string;
  sourceText: string;
  translatedText: string;
  from: string;
  to: string;
  createdAt?: string;
};

type PageMeta = { page: number; limit: number; total: number; pages: number };

type AuthMe = {
  status: "success" | "error";
  isAuthenticated: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

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

  // autodetect display (kept for UI chip if you want it later)
  const [detectedFrom, setDetectedFrom] = useState<string | null>(null);

  // user + history sidebar
  const [userEmail, setUserEmail] = useState<string>("");
  const [user, setUser] = useState<UserSafe | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [query, setQuery] = useState<string>("");

  // Helpers
  const codeToName = (code: string) =>
    languages.find(l => l.code === code)?.name || code.toUpperCase();

  // Fetch languages on mount
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const res = await api<{ status: string; supportedLanguages: Record<string, { name: string; nativeName: string }> }>(
          LANGUAGES_ENDPOINT,
          { method: "GET" }
        );
        const langs = Object.entries(res.supportedLanguages)
          .map(([code, info]) => ({ code, name: info.name || info.nativeName || code.toUpperCase() }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setLanguages(langs);
      } catch (e: any) {
        console.error("Failed to load languages:", e);
        setErr(e?.data?.message || "Failed to load languages.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // 1) Ask backend who I am using cookie (per your router: POST /api/auth)
        const me = await api<{ status: "success" | "error"; isAuthenticated: boolean; email?: string; firstName?: string; lastName?: string; phone?: string }>(
          "/api/auth",
          { method: "POST" }
        );

        if (!me.isAuthenticated || !me.email) {
          setErr("Not authenticated.");
          return;
        }

        setUserEmail(me.email);

        // (Optional) quick-fill
        setUser({
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          phone: me.phone,
        } as any);

        // 2) Fetch full profile via your users route (requires path param)
        const prof = await api<{ status: "success"; data: UserSafe }>(
          `/api/users/${encodeURIComponent(me.email)}`,
          { method: "GET" }
        );
        setUser(prof.data);

        // 3) Load first page of history
        await loadPage(1, query, me.email);
      } catch (e: any) {
        setErr(e?.data?.message || e?.message || "Failed to load user.");
      }
    })();
  }, []);

  // Clear detected chip when user changes inputs
  useEffect(() => {
    setDetectedFrom(null);
  }, [text, from]);

  const canTranslate = useMemo(
    () => text.trim().length > 0 && !!to && !loading,
    [text, to, loading]
  );

  async function loadPage(page: number, q: string, explicitEmail?: string) {
    const email = explicitEmail ?? userEmail;
    if (!email) return;

    const trimmed = q.trim();

    try {
      if (trimmed.length === 0) {
        // remove &limit=${limit}
        const res = await api<{ status: "success"; data: TranslationItem[]; meta: PageMeta }>(
          `/api/users/${encodeURIComponent(email)}/translations?page=${page}`,
          { method: "GET" }
        );
        setItems(res.data);
        setMeta(res.meta);
        return;
      }

      const base = `/api/users/${encodeURIComponent(email)}/translations/search?page=${page}`;
      const resSource = await api<{ status: "success"; data: TranslationItem[]; meta: PageMeta }>(
        base,
        { method: "POST", body: JSON.stringify({ sourceText: trimmed }) }
      );

      if (resSource.meta.total > 0) {
        setItems(resSource.data);
        setMeta(resSource.meta);
        return;
      }

      const resTranslated = await api<{ status: "success"; data: TranslationItem[]; meta: PageMeta }>(
        base,
        { method: "POST", body: JSON.stringify({ translatedText: trimmed }) }
      );
      setItems(resTranslated.data);
      setMeta(resTranslated.meta);
    } catch (e: any) {
      console.error("History load failed:", e?.data || e);
      setErr(e?.data?.message || e?.message || "Failed to load history.");
    }
  }

  async function handleTranslate() {
    if (!canTranslate) return;
    setLoading(true);
    setErr(null);
    setResult("");
    setDetectedFrom(null);

    try {
      const payload: Record<string, string> = { text: text.trim(), to };
      if (from !== "auto") payload.from = from;

      const res = await api<{
        status: string;
        translatedText?: string;
        translation?: string;
        text?: string;
        from?: string;
        to?: string;
      }>(TRANSLATE_ENDPOINT, { method: "POST", body: JSON.stringify(payload) });

      const out =
        res.translatedText ||
        (res as any).result ||
        res.translation ||
        (res as any).data ||
        res.text ||
        "";
      setResult(out);

      if (from === "auto" && res.from) setFrom(res.from);

      // refresh history after translate
      await loadPage(1, query);
    } catch (e: any) {
      setErr(e?.data?.message || e?.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    if (from === "auto") return;
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
    } catch { }
  }

  function speak() {
    if (!result) return;
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = to;
    window.speechSynthesis.speak(utterance);
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

  function selectHistory(item: TranslationItem) {
    setFrom(item.from || "auto");
    setTo(item.to || "en");
    setText(item.sourceText || "");
    setResult(item.translatedText || "");
  }

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <header className="header">
        <h2 className="h2">Dashboard</h2>
        <button className="btn btn-gradient" onClick={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {err && <div className="banner" role="alert">{err}</div>}

      {/* Layout: Sidebar + Main */}
      <div className="page-grid">
        {/* Sidebar */}
        <aside
          className="panel"
          style={{
            height: "calc(100vh - 160px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden" // list will scroll, header stays pinned
          }}
        >
          {/* Header block (pinned) */}
          <div style={{ paddingBottom: 8 }}>
            <div className="h2" style={{ fontSize: "1.2rem", margin: 0, fontFamily: "var(--font-display)" }}>
              Your Account
            </div>
            <div className="muted" style={{ marginTop: 6, fontFamily: "var(--font-ui)" }}>
              {user ? (
                <>
                  <div>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</div>
                  <div>{user.email}</div>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </div>

            {/* divider */}
            <div style={{ height: 1, background: "var(--panel-border)", margin: "12px 0" }} />

            {/* Search box + arrow + clear */}
            <label className="label">Search history</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  className="input no-icon"
                  placeholder="Search text…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPage(1, query)}
                  style={{ paddingRight: "2.4rem" }}
                />
                <button
                  onClick={() => loadPage(1, query)}
                  disabled={!query.trim()}
                  title="Search"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: query.trim() ? "pointer" : "default"
                  }}
                >
                  <ArrowRight
                    size={20}
                    color={query.trim() ? "#00d1c7" : "#3a495c"}
                    strokeWidth={2.2}
                  />
                </button>
              </div>

              <button
                className="link-btn"
                onClick={() => { setQuery(""); loadPage(1, ""); }}
                style={{ whiteSpace: "nowrap" }}
              >
                Clear
              </button>
            </div>

            {/* small meta line */}
            {meta?.total !== undefined && (
              <div className="muted" style={{ fontSize: ".85rem", marginTop: 6 }}>
                {meta.total} item{meta.total === 1 ? "" : "s"}
              </div>
            )}

            {/* divider */}
            <div style={{ height: 1, background: "var(--panel-border)", margin: "12px 0" }} />
            <div className="h2" style={{ fontSize: "1.05rem", margin: 0, fontFamily: "var(--font-display)" }}>
              History
            </div>
          </div>

          {/* Scrollable list */}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", marginTop: 8 }}>
            <div style={{ display: "grid", gap: 0 }}>
              {items.length === 0 && <div className="muted">No translations yet.</div>}

              {items.map((it) => (
                <button
                  key={it._id}
                  className="glass-card muted"
                  style={{ textAlign: "left", padding: 12, cursor: "pointer" }}
                  onClick={() => selectHistory(it)}
                  title={`${codeToName(it.from)} → ${codeToName(it.to)}`}
                  aria-label={`Open translation ${codeToName(it.from)} to ${codeToName(it.to)}`}
                >
                  <div className="muted" style={{ fontSize: ".85rem", marginBottom: 6, fontWeight: 700 }}>
                    {codeToName(it.from)} → {codeToName(it.to)}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {it.sourceText}
                  </div>
                  <div className="muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>
                    {it.translatedText}
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination pinned at bottom of list */}
            {meta.pages > 1 && (
              <div className="row-space" style={{ marginTop: 0 }}>
                <button
                  className="link-btn"
                  onClick={() => loadPage(Math.max(1, meta.page - 1), query)}
                  disabled={meta.page <= 1}
                >
                  ← Prev
                </button>
                <span className="muted">Page {meta.page} / {meta.pages}</span>
                <button
                  className="link-btn"
                  onClick={() => loadPage(Math.min(meta.pages, meta.page + 1), query)}
                  disabled={meta.page >= meta.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main translator panels */}
        <main>
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
                  {from === "auto" && detectedFrom && (
                    <div className="muted" style={{ marginTop: 6 }}>
                      Detected: <strong>{codeToName(detectedFrom)} ({detectedFrom})</strong>
                    </div>
                  )}
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
                <span className="muted" style={{ marginTop: 0 }}>{text.length} chars</span>
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
                <span className="muted" style={{ marginTop: 0 }}>{result.length} chars</span>
                <div className="row" style={{ gap: 12 }}>
                  <button
                    className="link-btn"
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                    onClick={speak}
                    disabled={!result}
                  >
                    <span role="img" aria-label="speaker" style={{ fontSize: "1rem", lineHeight: 1 }}>🔊</span>
                    Listen
                  </button>
                  <button className="link-btn" onClick={() => copy(result)} disabled={!result}>Copy</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
