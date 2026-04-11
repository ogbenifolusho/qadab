import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { BarChart3, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  success: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  failed: 'bg-red-400/10 text-red-400 border-red-400/20',
};

export default function AdminDonations() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['admin-donations-full'],
    queryFn: () => base44.entities.Donation.list('-created_date'),
  });

  const totalSuccess = donations.filter(d => d.payment_status === 'success').reduce((s, d) => s + (d.amount || 0), 0);

  const filtered = donations.filter(d => {
    const matchSearch = d.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.cause_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.donor_email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.payment_status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Donations</h1>
        <p className="text-slate-500 text-sm">
          {donations.length} total · <span className="text-emerald-400 font-bold">₦{totalSuccess.toLocaleString()}</span> confirmed
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {['success', 'pending', 'failed'].map(s => {
          const count = donations.filter(d => d.payment_status === s).length;
          const total = donations.filter(d => d.payment_status === s).reduce((acc, d) => acc + (d.amount || 0), 0);
          return (
            <div key={s} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-lg font-extrabold text-white">{count}</p>
              <p className="text-xs text-slate-500 capitalize">{s}</p>
              {s === 'success' && <p className="text-xs text-emerald-400 font-bold mt-1">₦{total.toLocaleString()}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search donor, cause, email..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 max-w-xs" />
        {['all', 'success', 'pending', 'failed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>{f}</button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No donations found.</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Donor</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden sm:table-cell">Cause</th>
                <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Amount</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Status</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{d.donor_name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-500">{d.donor_email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[140px] hidden sm:table-cell">{d.cause_name}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">₦{(d.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-md border font-semibold capitalize ${STATUS_STYLES[d.payment_status] || STATUS_STYLES.pending}`}>
                      {d.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                    {d.created_date ? format(new Date(d.created_date), 'MMM d, yyyy') : '—'}
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