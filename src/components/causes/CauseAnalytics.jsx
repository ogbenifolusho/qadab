import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Heart, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryColors = {
  shelter: '#3b82f6',
  education: '#6366f1',
  water: '#06b6d4',
  health: '#f43f5e',
  food: '#f97316',
  environment: '#10b981',
};

export default function CauseAnalytics({ causes, donations, predictions }) {
  const [expanded, setExpanded] = useState(null);

  const causeStats = causes.map(cause => {
    const causeDonations = donations.filter(d => d.cause_id === cause.id && d.payment_status === 'success');
    const causePredictions = predictions.filter(p => p.cause_id === cause.id);
    const correctPredictions = causePredictions.filter(p => p.status === 'correct');
    const totalRaised = causeDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const pledgedAmount = correctPredictions.reduce((sum, p) => sum + (p.pledge_amount || 0), 0);
    const uniqueSupporters = new Set([
      ...causeDonations.map(d => d.donor_email).filter(Boolean),
      ...causePredictions.map(p => p.created_by).filter(Boolean),
    ]).size;

    // Monthly donation trend (last 6 months)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const amount = causeDonations
        .filter(don => {
          const dt = new Date(don.created_date);
          return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
        })
        .reduce((sum, don) => sum + (don.amount || 0), 0);
      return { label, amount };
    });

    const percentage = cause.goal_amount
      ? Math.min(100, Math.round(((cause.raised_amount || 0) / cause.goal_amount) * 100))
      : 0;

    return {
      ...cause,
      totalRaised,
      pledgedAmount,
      uniqueSupporters,
      donationCount: causeDonations.length,
      predictionCount: causePredictions.length,
      correctCount: correctPredictions.length,
      monthlyData,
      percentage,
    };
  });

  // Sort by raised amount desc
  const sorted = [...causeStats].sort((a, b) => (b.raised_amount || 0) - (a.raised_amount || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-extrabold text-primary">Cause Impact Analytics</h2>
      </div>

      {/* Summary bar chart */}
      <Card className="p-5 mb-6">
        <p className="text-sm font-semibold text-muted-foreground mb-4">Funds Raised per Cause (₦)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sorted.map(c => ({ name: c.name?.split(' ')[0], raised: c.raised_amount || 0 }))} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₦${Number(v).toLocaleString()}`} />
            <Bar dataKey="raised" radius={[4, 4, 0, 0]}>
              {sorted.map((c, i) => (
                <Cell key={c.id} fill={categoryColors[c.category] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-cause expandable cards */}
      {sorted.map(cause => (
        <Card key={cause.id} className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/40 transition-colors"
            onClick={() => setExpanded(expanded === cause.id ? null : cause.id)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ background: categoryColors[cause.category] || '#6366f1' }}
            >
              {cause.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{cause.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={cause.percentage} className="h-1.5 flex-1" />
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{cause.percentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-primary">₦{(cause.raised_amount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">raised</p>
              </div>
              {expanded === cause.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          <AnimatePresence>
            {expanded === cause.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-5 border-t">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-5">
                    {[
                      { label: 'Total Raised', value: `₦${(cause.raised_amount || 0).toLocaleString()}`, icon: Heart, color: 'text-rose-500' },
                      { label: 'Pledged (correct)', value: `₦${cause.pledgedAmount.toLocaleString()}`, icon: Trophy, color: 'text-amber-500' },
                      { label: 'Supporters', value: cause.uniqueSupporters, icon: Users, color: 'text-blue-500' },
                      { label: 'Predictions', value: `${cause.correctCount}/${cause.predictionCount}`, icon: TrendingUp, color: 'text-emerald-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                        <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                        <p className="text-base font-extrabold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Monthly trend */}
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Monthly Donations (6 months)</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={cause.monthlyData} barSize={20}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${v / 1000 > 0 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip formatter={v => `₦${Number(v).toLocaleString()}`} />
                      <Bar dataKey="amount" fill={categoryColors[cause.category] || '#6366f1'} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}
    </div>
  );
}