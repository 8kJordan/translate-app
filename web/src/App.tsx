import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { useEffect, useState } from 'react'
import Brand from "@/components/Brand";

/**
 * Simple session state just for navigation demo.
 * The backend sets httpOnly cookies on login; in a real app we would also have a /me endpoint to verify.
 */
export default function App() {
  const [authed, setAuthed] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    // naive check for a query flag to simulate verified email landing
    if (new URLSearchParams(location.search).get('verified') === 'true') {
      setAuthed(true);
    }
  }, [location]);

  return (
    <div className="container">
      <header className="header">
        <Brand />
        <nav className="nav">
          <Link to="/">Login</Link>
          <Link to="/register">Register</Link>
          {authed && <Link to="/app">App</Link>}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Login onAuthed={() => setAuthed(true)} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={
          authed ? <Dashboard /> : <Navigate to="/" replace />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
