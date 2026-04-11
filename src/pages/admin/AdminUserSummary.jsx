import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Users, Loader2 } from 'lucide-react';
import { calcPoints } from '@/lib/scoring';

const SORT_OPTIONS = [
  { label: 'Total Impact', value: 'total' },
  { label: 'Direct Donations', value: 'donated' },
  { label: 'Pledges', value: 'pledged' },
  { label: 'Points', value: 'points' },
  { label: 'Predictions', value: 'predCount' },
];

export default function AdminUserSummary() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const { data: donations = [], isLoading: loadD } = useQuery({
    queryKey: ['admin-donations-full'],
    queryFn: () => base44.entities.Donation.list(),
  });
  const { data: predictions = [], isLoading: loadP } = useQuery({
    queryKey: ['admin-all-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
  });
  const { data: users = [], isLoading: loadU } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const isLoading = loadD || loadP || loadU;

  const summary = useMemo(() => {
    const map = {};

    // Seed with all known users
    users.forEach(u => {
      map[u.email] = {
        email: u.email,
        name: u.full_name || u.email,
        donated: 0,
        pledged: 0,
        predCount: 0,
        correctCount: 0,
        donCount: 0,
      };
    });

    donations.filter(d => d.payment_status === 'success' && d.donor_email).forEach(d => {
      const key = d.donor_email;
      if (!map[key]) map[key] = { email: key, name: d.donor_name || key, donated: 0, pledged: 0, predCount: 0, correctCount: 0, donCount: 0 };
      map[key].donated += d.amount || 0;
      map[key].donCount += 1;
    });

    predictions.forEach(p => {
      const key = p.created_by;
      if (!key) return;
      if (!map[key]) map[key] = { email: key, name: key, donated: 0, pledged: 0, predCount: 0, correctCount: 0, donCount: 0 };
      map[key].predCount += 1;
      if (p.status === 'correct') {
        map[key].pledged += p.pledge_amount || 0;
        map[key].correctCount += 1;
      }
    });

    return Object.values(map)
      .filter(u => u.donated > 0 || u.pledged > 0 || u.predCount > 0)
      .map(u => ({
        ...u,
        total: u.donated + u.pledged,
        points: calcPoints({ correctPredictions: u.correctCount, totalDonated: u.donated }),
      }));
  }, [donations, predictions, users]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = summary
    .filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aV = a[sortField] || 0;
      const bV = b[sortField] || 0;
      return sortDir === 'asc' ? aV - bV : bV - aV;
    });

  const SortTh = ({ field, children, align = 'left' }) => (
    <th
      className={`text-${align} text-xs text-slate-500 font-semibold px-4 py-3 cursor-pointer hover:text-slate-300 select-none`}
      onClick={() => toggleSort(field)}
    >
      <span className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-yellow-400' : 'opacity-40'}`} />
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">User Impact Summary</h1>
        <p className="text-slate-500 text-sm">Ranked by total impact — donations + pledges</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-white">{summary.length}</p>
          <p className="text-xs text-slate-500">Active Users</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-emerald-400">₦{summary.reduce((s, u) => s + u.donated, 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Donated</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-yellow-400">₦{summary.reduce((s, u) => s + u.pledged, 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Pledged</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-purple-400">{summary.reduce((s, u) => s + u.predCount, 0)}</p>
          <p className="text-xs text-slate-500">Total Predictions</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map(s => (
            <button key={s.value} onClick={() => toggleSort(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortField === s.value ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No user activity yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 w-8">#</th>
                <SortTh field="name">User</SortTh>
                <SortTh field="donated" align="right">Donated</SortTh>
                <SortTh field="pledged" align="right">Pledged</SortTh>
                <SortTh field="total" align="right">Total Impact</SortTh>
                <SortTh field="predCount" align="right">Predictions</SortTh>
                <SortTh field="points" align="right">Points</SortTh>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.email} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 font-bold">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-emerald-400">₦{u.donated.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{u.donCount} tx</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-yellow-400">₦{u.pledged.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{u.correctCount} correct</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-extrabold text-white">₦{u.total.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-slate-300">{u.predCount}</p>
                    <p className="text-xs text-slate-500">{u.predCount > 0 ? Math.round(u.correctCount / u.predCount * 100) : 0}% correct</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-extrabold text-purple-400">{u.points}</p>
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