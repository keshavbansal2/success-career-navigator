import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Github, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// ---------------------------------------------------------------------------
// User menu dropdown
// ---------------------------------------------------------------------------
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 glass hover:bg-white/10 text-slate-300 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 glass border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        location.pathname === to
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Career<span className="gradient-text">Nav</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/', 'Home')}
          {user && navLink('/analyze', 'Analyze')}

          {user ? (
            <div className="ml-2">
              <UserMenu />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="ml-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white transition-all shadow-lg shadow-violet-500/20"
              >
                Get Started
              </Link>
            </>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC = () => (
  <footer className="border-t border-white/5 mt-20 py-8">
    <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span>CareerNav AI</span>
      </div>
      <p className="text-slate-600 text-xs">Built to help students and early-career professionals level up</p>
    </div>
  </footer>
);

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
const AppContent: React.FC = () => (
  <div className="min-h-screen flex flex-col relative">
    <div className="mesh-bg" />
    <div className="mesh-blob" />
    <div className="noise" />

    <Navbar />
    <main className="flex-1 relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <Analyze />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
