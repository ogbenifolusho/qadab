import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Heart, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const SORT_OPTIONS = [
  { label: 'Total (Donations + Pledges)', value: 'total' },
  { label: 'Direct Donations', value: 'donations' },
  { label: 'Pledges', value: 'pledges' },
  { label: 'Cause Name', value: 'name' },
];

export default function AdminDonationSummary() {
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
  const { data: causes = [], isLoading: loadC } = useQuery({
    queryKey: ['admin-causes'],
    queryFn: () => base44.entities.Cause.list(),
  });

  const isLoading = loadD || loadP || loadC;

  const summary = useMemo(() => {
    const map = {};
    // Seed with all causes
    causes.forEach(c => {
      map[c.id] = {
        id: c.id,
        name: c.name,
        category: c.category,
        donations: 0,
        pledges: 0,
        donationCount: 0,
        pledgeCount: 0,
      };
    });

    donations.filter(d => d.payment_status === 'success').forEach(d => {
      const key = d.cause_id;
      if (!map[key]) map[key] = { id: key, name: d.cause_name || key, donations: 0, pledges: 0, donationCount: 0, pledgeCount: 0 };
      map[key].donations += d.amount || 0;
      map[key].donationCount += 1;
    });

    predictions.filter(p => p.status === 'correct').forEach(p => {
      const key = p.cause_id;
      if (!map[key]) map[key] = { id: key, name: p.cause_name || key, donations: 0, pledges: 0, donationCount: 0, pledgeCount: 0 };
      map[key].pledges += p.pledge_amount || 0;
      map[key].pledgeCount += 1;
    });

    return Object.values(map).map(c => ({ ...c, total: c.donations + c.pledges }));
  }, [donations, predictions, causes]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = summary
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let aV = sortField === 'name' ? a.name : a[sortField] || 0;
      let bV = sortField === 'name' ? b.name : b[sortField] || 0;
      if (typeof aV === 'string') return sortDir === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      return sortDir === 'asc' ? aV - bV : bV - aV;
    });

  const totalDonations = summary.reduce((s, c) => s + c.donations, 0);
  const totalPledges = summary.reduce((s, c) => s + c.pledges, 0);

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
        <h1 className="text-2xl font-extrabold text-white">Beneficiary Summary</h1>
        <p className="text-slate-500 text-sm">Ranked by total funds received — donations + pledges</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-white">₦{totalDonations.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Direct Donations</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-yellow-400">₦{totalPledges.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Pledges (correct)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-lg font-extrabold text-emerald-400">₦{(totalDonations + totalPledges).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Grand Total</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search beneficiary..."
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
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No beneficiary data yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 w-8">#</th>
                <SortTh field="name">Beneficiary</SortTh>
                <SortTh field="donations" align="right">Direct Donations</SortTh>
                <SortTh field="pledges" align="right">Pledges</SortTh>
                <SortTh field="total" align="right">Total</SortTh>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 font-bold">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.category && <p className="text-xs text-slate-500 capitalize">{c.category}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-emerald-400">₦{c.donations.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{c.donationCount} donation{c.donationCount !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-yellow-400">₦{c.pledges.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{c.pledgeCount} pledge{c.pledgeCount !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-extrabold text-white">₦{c.total.toLocaleString()}</p>
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