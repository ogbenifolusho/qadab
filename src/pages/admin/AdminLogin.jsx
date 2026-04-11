import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) {
        const me = await base44.auth.me();
        if (me.role === 'admin') navigate('/admin', { replace: true });
      }
    });
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.origin + '/admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Qada<span className="text-yellow-400">.</span>Bet
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-semibold uppercase tracking-widest">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Administrator Login</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Sign in with your admin account to access the management dashboard.
          </p>

          <Button
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-5 text-base gap-2"
            onClick={handleLogin}
          >
            <Shield className="w-5 h-5" />
            Sign In as Admin
          </Button>

          <p className="text-xs text-slate-600 mt-6">
            Only users with admin role can access this area.
          </p>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to Qada.Bet
          </a>
        </p>
      </div>
    </div>
  );
}