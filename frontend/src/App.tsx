import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Brain, Github } from 'lucide-react';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import './index.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">CareerNav <span className="text-indigo-400">AI</span></span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Home
          </Link>
          <Link
            to="/analyze"
            className={`text-sm font-medium transition-colors ${location.pathname === '/analyze' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Analyze
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t border-slate-800 mt-20 py-8">
    <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Brain className="w-4 h-4 text-indigo-400" />
        CareerNav AI
      </div>
      <p className="text-slate-500 text-xs">Built to help students and early-career professionals</p>
    </div>
  </footer>
);

const AppContent: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-950">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
