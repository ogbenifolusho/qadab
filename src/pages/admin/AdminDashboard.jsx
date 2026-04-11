import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Trophy, Heart, Users, BarChart3, CheckCircle2, Clock, DollarSign, TrendingUp, ArrowRight, PieChart, UserCheck, Gift, FileBarChart2 } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function QuickLink({ to, label, icon: Icon, desc }) {
  return (
    <Link to={to}>
      <div className="bg-slate-900 border border-slate-800 hover:border-yellow-400/40 hover:bg-slate-800 rounded-xl p-4 flex items-center gap-3 group transition-all">
        <div className="w-9 h-9 bg-yellow-400/10 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500 truncate">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors" />
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: events = [] } = useQuery({ queryKey: ['admin-events'], queryFn: () => base44.entities.Event.list() });
  const { data: causes = [] } = useQuery({ queryKey: ['admin-causes'], queryFn: () => base44.entities.Cause.list() });
  const { data: predictions = [] } = useQuery({ queryKey: ['admin-predictions'], queryFn: () => base44.entities.Prediction.list() });
  const { data: donations = [] } = useQuery({ queryKey: ['admin-donations'], queryFn: () => base44.entities.Donation.list() });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list() });

  const totalDonated = donations.filter(d => d.payment_status === 'success').reduce((s, d) => s + (d.amount || 0), 0);
  const pendingEvents = events.filter(e => e.status === 'upcoming').length;
  const pendingCauses = causes.filter(c => !c.is_verified).length;
  const correctPredictions = predictions.filter(p => p.status === 'correct').length;

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-400/10 text-blue-400' },
    { label: 'Total Events', value: events.length, icon: Trophy, color: 'bg-yellow-400/10 text-yellow-400', sub: `${pendingEvents} upcoming` },
    { label: 'Total Predictions', value: predictions.length, icon: TrendingUp, color: 'bg-purple-400/10 text-purple-400', sub: `${correctPredictions} correct` },
    { label: 'Total Donations', value: `₦${totalDonated.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-400/10 text-emerald-400' },
    { label: 'Beneficiaries', value: causes.length, icon: Heart, color: 'bg-rose-400/10 text-rose-400', sub: `${pendingCauses} pending approval` },
    { label: 'Pending Events', value: pendingEvents, icon: Clock, color: 'bg-amber-400/10 text-amber-400' },
  ];

  // Recent activity
  const recentDonations = [...donations].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of all platform activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <QuickLink to="/admin/events" label="Manage Events" icon={Trophy} desc="Add, edit or resolve football matches" />
            <QuickLink to="/admin/causes" label="Approve Beneficiaries" icon={Heart} desc={`${pendingCauses} pending verification`} />
            <QuickLink to="/admin/beneficiary-payouts" label="Beneficiary Payouts" icon={DollarSign} desc="Process & approve cause donation payouts" />
            <QuickLink to="/admin/settings" label="Site Settings" icon={CheckCircle2} desc="Update name, logo, pledge amounts" />
          </div>
        </div>

        {/* Recent Donations */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Donations</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {recentDonations.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No donations yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Donor</th>
                    <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Cause</th>
                    <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map(d => (
                    <tr key={d.id} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-3 text-sm text-slate-300 truncate max-w-[120px]">{d.donor_name || 'Anonymous'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">{d.cause_name}</td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">₦{(d.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}