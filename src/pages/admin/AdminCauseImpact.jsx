import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Heart, TrendingUp, Users, Search, DollarSign } from 'lucide-react';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const CATEGORY_LABELS = {
  shelter: '🏠 Shelter', education: '📚 Education', water: '💧 Water',
  health: '❤️ Health', food: '🍱 Food', environment: '🌿 Environment',
};

const chartTooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' },
  labelStyle: { color: '#94a3b8' },
};

export default function AdminCauseImpact() {
  const [search, setSearch] = useState('');

  const { data: causes = [] } = useQuery({ queryKey: ['impact-causes'], queryFn: () => base44.entities.Cause.list() });
  const { data: donations = [] } = useQuery({ queryKey: ['impact-donations'], queryFn: () => base44.entities.Donation.list() });
  const { data: predictions = [] } = useQuery({ queryKey: ['impact-predictions'], queryFn: () => base44.entities.Prediction.list() });

  const causeStats = useMemo(() => {
    const map = {};
    causes.forEach(c => {
      map[c.id] = {
        ...c,
        directDonations: 0,
        donorCount: new Set(),
        pledged: 0,
        predictorCount: new Set(),
        donationCount: 0,
      };
    });
    donations.filter(d => d.payment_status === 'success').forEach(d => {
      if (!map[d.cause_id]) return;
      map[d.cause_id].directDonations += d.amount || 0;
      map[d.cause_id].donorCount.add(d.donor_email || d.created_by);
      map[d.cause_id].donationCount++;
    });
    predictions.forEach(p => {
      if (!map[p.cause_id]) return;
      map[p.cause_id].pledged += p.pledge_amount || 0;
      map[p.cause_id].predictorCount.add(p.created_by);
    });
    return Object.values(map)
      .map(c => ({
        ...c,
        donorCount: c.donorCount.size,
        predictorCount: c.predictorCount.size,
        totalImpact: c.directDonations + c.pledged,
        goalProgress: c.goal_amount > 0 ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0,
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact);
  }, [causes, donations, predictions]);

  const filtered = causeStats.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Category breakdown for pie
  const categoryData = useMemo(() => {
    const map = {};
    causeStats.forEach(c => {
      if (!map[c.category]) map[c.category] = 0;
      map[c.category] += c.directDonations;
    });
    return Object.entries(map)
      .map(([cat, val]) => ({ name: CATEGORY_LABELS[cat] || cat, value: val }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [causeStats]);

  // Top 6 for bar chart
  const barData = causeStats.slice(0, 6).map(c => ({
    name: c.name?.length > 16 ? c.name.slice(0, 14) + '…' : c.name,
    Direct: c.directDonations,
    Pledged: c.pledged,
  }));

  const totalDirect = causeStats.reduce((s, c) => s + c.directDonations, 0);
  const totalPledged = causeStats.reduce((s, c) => s + c.pledged, 0);
  const totalDonors = new Set(donations.filter(d => d.payment_status === 'success').map(d => d.donor_email || d.created_by)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Heart className="w-6 h-6 text-rose-400" /> Cause Impact Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Detailed impact breakdown per verified cause</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Causes', value: causes.length, icon: Heart, color: 'text-rose-400' },
          { label: 'Total Donated', value: `₦${totalDirect.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Pledged', value: `₦${totalPledged.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Unique Donors', value: totalDonors, icon: Users, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Top Causes by Impact (₦)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} formatter={v => `₦${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Bar dataKey="Direct" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pledged" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Donations by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={v => `₦${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1 justify-center">
              {categoryData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cause table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">All Causes</h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="Search cause..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 h-8 text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((cause, idx) => (
            <div key={cause.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-300">#{idx + 1}</span>
                    <p className="text-base font-extrabold text-white">{cause.name}</p>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{CATEGORY_LABELS[cause.category] || cause.category}</Badge>
                    {cause.is_verified && <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-0">✓ Verified</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{cause.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-emerald-400">₦{cause.directDonations.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">direct donations</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
                {[
                  { label: 'Total Raised', value: `₦${(cause.raised_amount || 0).toLocaleString()}`, color: 'text-emerald-400' },
                  { label: 'Pledged', value: `₦${cause.pledged.toLocaleString()}`, color: 'text-blue-400' },
                  { label: 'Donors', value: cause.donorCount, color: 'text-purple-400' },
                  { label: 'Predictors', value: cause.predictorCount, color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-3">
                    <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {cause.goal_amount > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Fundraising Goal Progress</span>
                    <span className="font-bold text-white">{cause.goalProgress}% — ₦{(cause.raised_amount || 0).toLocaleString()} / ₦{cause.goal_amount.toLocaleString()}</span>
                  </div>
                  <Progress value={cause.goalProgress} className="h-2 bg-slate-800" />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-10">No causes found.</p>
          )}
        </div>
      </div>
    </div>
  );
}