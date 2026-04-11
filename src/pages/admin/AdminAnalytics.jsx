import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Trophy, Users, Heart, TrendingUp, CheckCircle2, XCircle, Clock, Target } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ icon: Icon, label, value, sub, color = 'text-yellow-400' }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const { data: events = [] } = useQuery({
    queryKey: ['analytics-events'],
    queryFn: () => base44.entities.Event.list(),
  });
  const { data: predictions = [] } = useQuery({
    queryKey: ['analytics-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
  });
  const { data: donations = [] } = useQuery({
    queryKey: ['analytics-donations'],
    queryFn: () => base44.entities.Donation.list(),
  });
  const { data: causes = [] } = useQuery({
    queryKey: ['analytics-causes'],
    queryFn: () => base44.entities.Cause.list(),
  });

  // ── Key metrics ──────────────────────────────────────────────────────────
  const totalPledged = predictions.reduce((s, p) => s + (p.pledge_amount || 0), 0);
  const totalDonated = donations.filter(d => d.payment_status === 'success').reduce((s, d) => s + (d.amount || 0), 0);
  const correctPreds = predictions.filter(p => p.status === 'correct').length;
  const pendingPreds = predictions.filter(p => p.status === 'pending').length;
  const accuracy = predictions.filter(p => p.status !== 'pending' && p.status !== 'cancelled').length
    ? Math.round((correctPreds / predictions.filter(p => p.status !== 'pending' && p.status !== 'cancelled').length) * 100)
    : 0;

  // ── Event status breakdown ────────────────────────────────────────────────
  const eventStatusData = useMemo(() => {
    const counts = { upcoming: 0, live: 0, completed: 0, cancelled: 0 };
    events.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [events]);

  // ── Predictions per outcome ───────────────────────────────────────────────
  const outcomeData = useMemo(() => {
    const counts = { home_win: 0, draw: 0, away_win: 0 };
    predictions.forEach(p => { if (counts[p.selected_outcome] !== undefined) counts[p.selected_outcome]++; });
    return [
      { name: 'Home Win', value: counts.home_win },
      { name: 'Draw', value: counts.draw },
      { name: 'Away Win', value: counts.away_win },
    ];
  }, [predictions]);

  // ── Prediction status breakdown ───────────────────────────────────────────
  const predStatusData = useMemo(() => {
    const counts = { pending: 0, correct: 0, incorrect: 0, cancelled: 0 };
    predictions.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [predictions]);

  // ── Top 5 causes by donations + pledges ──────────────────────────────────
  const causeRankData = useMemo(() => {
    const map = {};
    causes.forEach(c => { map[c.id] = { name: c.name, direct: 0, pledged: 0 }; });
    donations.filter(d => d.payment_status === 'success').forEach(d => {
      if (map[d.cause_id]) map[d.cause_id].direct += d.amount || 0;
    });
    predictions.forEach(p => {
      if (map[p.cause_id]) map[p.cause_id].pledged += p.pledge_amount || 0;
    });
    return Object.values(map)
      .map(c => ({ ...c, total: c.direct + c.pledged }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [causes, donations, predictions]);

  // ── Predictions over last 14 days ─────────────────────────────────────────
  const predTimeData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: format(d, 'MMM d'), ts: d.getTime(), count: 0 };
    });
    predictions.forEach(p => {
      if (!p.created_date) return;
      const ts = startOfDay(new Date(p.created_date)).getTime();
      const bucket = days.find(d => d.ts === ts);
      if (bucket) bucket.count++;
    });
    return days;
  }, [predictions]);

  // ── Donations over last 14 days ───────────────────────────────────────────
  const donTimeData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: format(d, 'MMM d'), ts: d.getTime(), amount: 0 };
    });
    donations.filter(d => d.payment_status === 'success').forEach(d => {
      if (!d.created_date) return;
      const ts = startOfDay(new Date(d.created_date)).getTime();
      const bucket = days.find(b => b.ts === ts);
      if (bucket) bucket.amount += d.amount || 0;
    });
    return days;
  }, [donations]);

  const chartTooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' },
    labelStyle: { color: '#94a3b8' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Analytics</h1>
        <p className="text-slate-500 text-sm">Platform performance overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Total Events" value={events.length} sub={`${events.filter(e => e.status === 'live').length} live`} color="text-yellow-400" />
        <StatCard icon={Users} label="Total Predictions" value={predictions.length} sub={`${pendingPreds} pending`} color="text-blue-400" />
        <StatCard icon={Heart} label="Total Donated" value={`₦${totalDonated.toLocaleString()}`} sub={`${donations.filter(d => d.payment_status === 'success').length} transactions`} color="text-rose-400" />
        <StatCard icon={TrendingUp} label="Total Pledged" value={`₦${totalPledged.toLocaleString()}`} sub={`${accuracy}% accuracy`} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Correct Predictions" value={correctPreds} color="text-emerald-400" />
        <StatCard icon={XCircle} label="Incorrect Predictions" value={predictions.filter(p => p.status === 'incorrect').length} color="text-red-400" />
        <StatCard icon={Clock} label="Pending" value={pendingPreds} color="text-amber-400" />
        <StatCard icon={Target} label="Prediction Accuracy" value={`${accuracy}%`} sub="among graded only" color="text-purple-400" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predictions over time */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Predictions — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={predTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Predictions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donations over time */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Donations (₦) — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={donTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`₦${v.toLocaleString()}`, 'Donated']} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} name="Donated (₦)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction outcome breakdown */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Prediction Choices</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {outcomeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs text-slate-400 mt-1">
              {outcomeData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prediction status breakdown */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Prediction Results</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={predStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {predStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1 justify-center">
              {predStatusData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event status breakdown */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Event Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={eventStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {eventStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1 justify-center">
              {eventStatusData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top causes bar chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold">Top Causes by Impact (₦)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={causeRankData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => `₦${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="direct" name="Direct Donations" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pledged" name="Pledged" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}