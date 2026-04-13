import API_BASE from "./api";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TV from './pages/TV';
import Requests from './pages/Requests';
import Downloads from './pages/Downloads';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Detail from './pages/Detail';
import Watchlist from './pages/Watchlist';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const [setupComplete, setSetupComplete] = useState(null); // null = loading

  useEffect(() => {
    fetch(API_BASE + '/api/setup/status')
      .then(r => r.json())
      .then(d => setSetupComplete(d.complete))
      .catch(() => setSetupComplete(true)); // fail open — don't block the app
  }, []);

  if (setupComplete === null) return null; // wait before rendering any route

  if (!setupComplete) {
    // Force everything to /setup until wizard is complete
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Navigate to="/app" replace />} />
      <Route path="/app/*" element={
        <ProtectedRoute>
          <div className="app">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv" element={<TV />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/detail/:type/:id" element={<Detail />} />
              <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
