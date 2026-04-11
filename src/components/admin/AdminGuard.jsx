import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import AdminLayout from './AdminLayout';

export default function AdminGuard() {
  const [status, setStatus] = useState('loading'); // loading | ok | unauth | forbidden
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) { setStatus('unauth'); return; }
      const me = await base44.auth.me();
      setUser(me);
      if (me.role !== 'admin') { setStatus('forbidden'); return; }
      setStatus('ok');
    });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (status === 'unauth') {
    return <Navigate to="/admin/login" replace />;
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-center p-8">
        <div>
          <p className="text-4xl mb-3">🚫</p>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return <AdminLayout user={user} />;
}