import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Gift, Crown, CheckCircle2, Mail, Loader2, Search, Star } from 'lucide-react';
import { calcPoints, getMilestone, MILESTONES } from '@/lib/scoring';
import { toast } from 'sonner';

const PRIZE_TIERS = [
  { rank: 1, label: '🥇 1st Place', prize: '₦50,000', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { rank: 2, label: '🥈 2nd Place', prize: '₦25,000', color: 'text-slate-300', bg: 'bg-slate-700/30 border-slate-600/30' },
  { rank: 3, label: '🥉 3rd Place', prize: '₦10,000', color: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-600/30' },
];

export default function AdminPrizePayout() {
  const [search, setSearch] = useState('');
  const [payingEmail, setPayingEmail] = useState(null);
  const qc = useQueryClient();

  const { data: predictions = [] } = useQuery({ queryKey: ['payout-predictions'], queryFn: () => base44.entities.Prediction.list() });
  const { data: donations = [] } = useQuery({ queryKey: ['payout-donations'], queryFn: () => base44.entities.Donation.list() });
  const { data: users = [] } = useQuery({ queryKey: ['payout-users'], queryFn: () => base44.entities.User.list() });

  const userMap = useMemo(() => {
    const m = {};
    users.forEach(u => { m[u.email] = u; });
    return m;
  }, [users]);

  const leaderboard = useMemo(() => {
    const statsMap = {};
    predictions.forEach(p => {
      if (!p.created_by) return;
      if (!statsMap[p.created_by]) statsMap[p.created_by] = { correct: 0, total: 0, pledged: 0, donated: 0 };
      statsMap[p.created_by].total++;
      statsMap[p.created_by].pledged += p.pledge_amount || 0;
      if (p.status === 'correct') statsMap[p.created_by].correct++;
    });
    donations.filter(d => d.payment_status === 'success').forEach(d => {
      if (!d.created_by) return;
      if (!statsMap[d.created_by]) statsMap[d.created_by] = { correct: 0, total: 0, pledged: 0, donated: 0 };
      statsMap[d.created_by].donated += d.amount || 0;
    });
    return Object.entries(statsMap)
      .map(([email, s]) => ({
        email,
        name: userMap[email]?.full_name || email.split('@')[0],
        correct: s.correct,
        total: s.total,
        pledged: s.pledged,
        donated: s.donated,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        points: calcPoints({ correctPredictions: s.correct, totalDonated: s.donated }),
      }))
      .sort((a, b) => b.points - a.points || b.correct - a.correct);
  }, [predictions, donations, userMap]);

  const filtered = leaderboard.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const sendPrizeMutation = useMutation({
    mutationFn: async ({ entry, rank }) => {
      const tier = PRIZE_TIERS.find(t => t.rank === rank);
      await base44.integrations.Core.SendEmail({
        to: entry.email,
        subject: `🏆 Congratulations! You've won a prize on Qada.Bet`,
        body: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;">
            <h2 style="color:#1a237e;font-size:28px;font-weight:800;margin-bottom:8px;">🎉 Congratulations, ${entry.name}!</h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin-bottom:24px;">
              You've ranked <strong>#${rank}</strong> on the Qada.Bet Leaderboard with <strong>${entry.points} points</strong>.
            </p>
            <div style="background:linear-gradient(135deg,#1a237e,#283593);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Your Prize</p>
              <p style="color:#f9a825;font-size:40px;font-weight:900;margin:0;">${tier?.prize || 'Prize'}</p>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">${tier?.label}</p>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.7;">
              Our team will reach out to process your payout. Thank you for being an incredible impact-maker on Qada.Bet!
            </p>
            <p style="color:#555;font-size:14px;margin-top:16px;">With gratitude,<br/><strong style="color:#1a237e;">The Qada.Bet Team</strong></p>
          </div>
        `,
      });
      await base44.entities.Notification.create({
        user_email: entry.email,
        type: 'general',
        title: `🏆 You won a prize! ${tier?.prize}`,
        message: `Congratulations! You ranked #${rank} on the leaderboard with ${entry.points} points. Your prize of ${tier?.prize} is being processed.`,
        is_read: false,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Prize notification sent to ${vars.entry.email}`);
      setPayingEmail(null);
    },
    onError: () => {
      toast.error('Failed to send notification. Try again.');
      setPayingEmail(null);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Gift className="w-6 h-6 text-yellow-400" /> Prize Payouts</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage and distribute prizes to top-ranked users</p>
      </div>

      {/* Prize Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRIZE_TIERS.map((tier, idx) => {
          const winner = leaderboard[idx];
          return (
            <div key={tier.rank} className={`rounded-2xl border p-5 ${tier.bg}`}>
              <p className={`text-lg font-extrabold ${tier.color}`}>{tier.label}</p>
              <p className="text-3xl font-black text-white mt-1">{tier.prize}</p>
              {winner ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-slate-200 truncate">{winner.name}</p>
                  <p className="text-xs text-slate-400 truncate">{winner.email}</p>
                  <p className="text-xs text-slate-400">{winner.points} pts · {winner.correct} correct</p>
                  <Button
                    size="sm"
                    className="w-full mt-2 gap-2 bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold"
                    disabled={sendPrizeMutation.isPending && payingEmail === winner.email}
                    onClick={() => {
                      setPayingEmail(winner.email);
                      sendPrizeMutation.mutate({ entry: winner, rank: tier.rank });
                    }}
                  >
                    {sendPrizeMutation.isPending && payingEmail === winner.email
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Mail className="w-3 h-3" />
                    }
                    Notify Winner
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3">No users yet</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Full Rankings</h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="Search user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 h-8 text-sm"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Rank</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">User</th>
                <th className="text-center text-xs text-slate-500 font-semibold px-4 py-3">Points</th>
                <th className="text-center text-xs text-slate-500 font-semibold px-4 py-3">Correct</th>
                <th className="text-center text-xs text-slate-500 font-semibold px-4 py-3">Accuracy</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Milestone</th>
                <th className="text-center text-xs text-slate-500 font-semibold px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => {
                const rank = leaderboard.indexOf(entry) + 1;
                const milestone = getMilestone(entry.points);
                const isPrize = rank <= 3;
                return (
                  <tr key={entry.email} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${isPrize ? 'text-yellow-400' : 'text-slate-500'}`}>#{rank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-200 font-medium truncate max-w-[140px]">{entry.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[140px]">{entry.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-extrabold text-white">{entry.points}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-emerald-400 font-semibold">{entry.correct}/{entry.total}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300">{entry.accuracy}%</td>
                    <td className="px-4 py-3">
                      {milestone ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${milestone.color}`}>{milestone.badge}</span>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPrize && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-slate-700 text-slate-300 hover:border-yellow-400/50 hover:text-yellow-400"
                          disabled={sendPrizeMutation.isPending && payingEmail === entry.email}
                          onClick={() => {
                            setPayingEmail(entry.email);
                            sendPrizeMutation.mutate({ entry, rank });
                          }}
                        >
                          {sendPrizeMutation.isPending && payingEmail === entry.email
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Mail className="w-3 h-3" />
                          }
                          Notify
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 text-sm py-10">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestones legend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Milestone Tiers</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MILESTONES.map(m => (
            <div key={m.points} className={`rounded-lg px-3 py-2 text-xs font-semibold ${m.color} flex flex-col gap-0.5`}>
              <span>{m.badge}</span>
              <span className="opacity-70">{m.points}+ pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}