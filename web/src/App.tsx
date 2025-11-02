import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { useEffect, useState } from 'react'
import Brand from "@/components/Brand"
import { api } from '@/api'

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

    // Silent refresh using refreshToken cookie
    (async () => {
      try {
        await api<{ status: string }>('/api/auth/refresh', { method: 'POST' });
        setAuthed(true);
      } catch {
        setAuthed(false);
      }
    })();
  }, [location.search]);

  // Don't render routes that could redirect until we know auth state
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
            authed ? (
              <Dashboard onLogout={() => setAuthed(false)} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}