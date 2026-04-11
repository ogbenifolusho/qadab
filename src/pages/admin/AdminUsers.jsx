import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Users, Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { format } from 'date-fns';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.newRole === 'admin' ? 'Grant Admin Access?' : 'Revoke Admin Access?'}
        message={confirm?.newRole === 'admin'
          ? `Give admin privileges to "${confirm?.user?.full_name || confirm?.user?.email}"?`
          : `Remove admin access from "${confirm?.user?.full_name || confirm?.user?.email}"?`}
        confirmLabel="Confirm"
        variant="warning"
        onConfirm={() => {
          updateRole.mutate({ id: confirm.user.id, role: confirm.newRole });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <div>
        <h1 className="text-2xl font-extrabold text-white">Users</h1>
        <p className="text-slate-500 text-sm">{users.length} registered users</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 max-w-xs" />
        {['all', 'admin', 'user'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>{f === 'all' ? 'All Users' : f === 'admin' ? 'Admins' : 'Regular Users'}</button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No users found.</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">User</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden md:table-cell">Joined</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Role</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {u.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{u.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                    {u.created_date ? format(new Date(u.created_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-md border font-semibold ${
                      u.role === 'admin'
                        ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                        : 'bg-slate-700/50 text-slate-400 border-slate-700'
                    }`}>
                      {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setConfirm({ user: u, newRole: u.role === 'admin' ? 'user' : 'admin' })}
                        className={`p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1 px-2 ${
                          u.role === 'admin' ? 'text-amber-400 hover:text-slate-400' : 'text-slate-400 hover:text-yellow-400'
                        }`}
                        title={u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      >
                        {u.role === 'admin'
                          ? <><ShieldX className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Revoke</span></>
                          : <><ShieldCheck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Make Admin</span></>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}