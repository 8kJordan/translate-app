import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { ReactNode, useEffect, useState } from 'react'
import Brand from "@/components/Brand"
import { api } from '@/api'

function RequireAuth({
  children,
  onFail
}: { children: ReactNode; onFail: () => void }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Gate access on refresh only
        await api<{ status: string }>('/api/auth/refresh', { method: 'POST' });

        try {
          const res = await api<{ isAuthenticated: boolean }>('/api/auth', { method: 'POST' });
          if (res?.isAuthenticated) {
            console.log('auth succeeded ✅');
          }
        } catch (err) {
          console.error('auth failed:', err);
        }

        setChecking(false);
      } catch {
        onFail();
        navigate('/', { replace: true });
      }
    })();
  }, [navigate, onFail]);

  if (checking) {
    return (
      <div className="container">
        <header className="header"><Brand /></header>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  // null = unknown (loading), true/false once we know
  const [authed, setAuthed] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const search = new URLSearchParams(location.search);

    // If we just came back from email verification
    if (search.get('verified') === 'true') {
      setAuthed(true);
      return;
    }

    (async () => {
      try {
        // Refresh first; if this works, consider user authed
        await api<{ status: string }>('/api/auth/refresh', { method: 'POST' });
        setAuthed(true);

        // Best-effort confirm; do NOT flip to false on a transient /auth miss
        try {
          await api<{ isAuthenticated: boolean }>('/api/', { method: 'POST' });
        } catch { /* ignore */ }
      } catch {
        setAuthed(false);
      }
    })();
  }, [location.search]);

  if (authed === null) {
    return (
      <div className="container">
        <header className="header"><Brand /></header>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Checking session…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <Brand />
      </header>

      <Routes>
        <Route path="/" element={<Login onAuthed={() => setAuthed(true)} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
            <RequireAuth onFail={() => setAuthed(false)}>
              <Dashboard onLogout={() => setAuthed(false)} />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
