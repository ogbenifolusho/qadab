import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Clock, CheckCircle2, XCircle, Heart, ArrowRight, Loader2, Medal, Star } from 'lucide-react';
import { format } from 'date-fns';
import EventCountdown from '@/components/EventCountdown';
import ShareButton from '@/components/ShareButton';
import { calcPoints, getMilestone } from '@/lib/scoring';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  correct: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Correct' },
  incorrect: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Incorrect' },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Real-time: refresh when predictions are graded or events change
  useEffect(() => {
    const unsubP = base44.entities.Prediction.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['my-predictions-dash'] });
    });
    const unsubE = base44.entities.Event.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['events'] });
    });
    return () => { unsubP(); unsubE(); };
  }, []);

  const { data: myPredictions } = useQuery({
    queryKey: ['my-predictions-dash', user?.email],
    queryFn: () => base44.entities.Prediction.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: allPredictions } = useQuery({
    queryKey: ['all-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
    initialData: [],
  });

  const { data: myDonations } = useQuery({
    queryKey: ['my-donations', user?.email],
    queryFn: () => base44.entities.Donation.filter({ created_by: user.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allDonations } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list(),
    initialData: [],
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-event_date'),
    initialData: [],
  });

  const upcomingAndLive = events.filter(e => e.status === 'upcoming' || e.status === 'live');

  const correct = myPredictions.filter(p => p.status === 'correct').length;
  const total = myPredictions.length;
  const totalPledged = myPredictions.reduce((s, p) => s + (p.pledge_amount || 0), 0);
  const myTotalDonated = myDonations.filter(d => d.payment_status === 'success').reduce((s, d) => s + (d.amount || 0), 0);
  const myPoints = calcPoints({ correctPredictions: correct, totalDonated: myTotalDonated });
  const myMilestone = getMilestone(myPoints);

  // Build combined leaderboard to find rank
  const statsMap = {};
  allPredictions.forEach(p => {
    if (!statsMap[p.created_by]) statsMap[p.created_by] = { correct: 0, donated: 0 };
    if (p.status === 'correct') statsMap[p.created_by].correct++;
  });
  allDonations.forEach(d => {
    if (!statsMap[d.created_by]) statsMap[d.created_by] = { correct: 0, donated: 0 };
    if (d.payment_status === 'success') statsMap[d.created_by].donated += d.amount || 0;
  });
  const sorted = Object.entries(statsMap)
    .map(([email, s]) => ({ email, points: calcPoints({ correctPredictions: s.correct, totalDonated: s.donated }) }))
    .sort((a, b) => b.points - a.points);
  const rank = sorted.findIndex(e => e.email === user?.email) + 1;

  const stats = [
    { label: 'Total Predictions', value: total, icon: Trophy, color: 'from-blue-600 to-blue-800' },
    { label: 'Correct Picks', value: correct, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Total Pledged', value: `₦${totalPledged.toLocaleString()}`, icon: Heart, color: 'from-rose-500 to-rose-700' },
    { label: 'Your Rank', value: rank > 0 ? `#${rank}` : '—', icon: Medal, color: 'from-amber-500 to-yellow-600' },
  ];

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider mb-1">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{user.full_name}</h1>
            <p className="text-primary-foreground/60 text-sm mt-1">{user.email}</p>
            {/* Points & milestone pill */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5">
                <Star className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold">{myPoints} pts</span>
              </div>
              {myMilestone && (
                <span className={`text-sm px-3 py-1.5 rounded-full font-bold ${myMilestone.color}`}>
                  {myMilestone.badge}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 sm:p-5 text-white text-center shadow-md`}>
              <s.icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-xl sm:text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs mt-1 opacity-80">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Fixtures */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upcoming Fixtures</h2>
            <Link to="/predict">
              <Button size="sm" variant="outline" className="gap-1">Predict <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </div>
          {upcomingAndLive.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No upcoming events right now.</Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingAndLive.slice(0, 4).map(event => (
                <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${event.status === 'live' ? 'bg-emerald-100' : 'bg-primary/10'}`}>
                      <Trophy className={`w-5 h-5 ${event.status === 'live' ? 'text-emerald-600' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{event.title}</p>
                        {event.status === 'live' && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">🔴 LIVE</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize text-xs">{event.category}</Badge>
                          {event.event_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.event_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {event.event_date && event.status === 'upcoming' && <EventCountdown eventDate={event.event_date} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">₦{(event.pledge_amount || 100).toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prediction History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Prediction History</h2>
            <Link to="/history">
              <Button size="sm" variant="outline" className="gap-1">View All <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </div>
          {myPredictions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="mb-3">No predictions yet.</p>
              <Link to="/predict">
                <Button size="sm" className="gap-2"><Trophy className="w-4 h-4" /> Make Your First Prediction</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {myPredictions.slice(0, 5).map((p) => {
                const status = statusConfig[p.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.event_title}</p>
                        <p className="text-xs text-muted-foreground">Pick: <strong>{{ home_win: 'Home Win', draw: 'Draw', away_win: 'Away Win' }[p.selected_outcome] || p.selected_outcome}</strong> · {p.cause_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="font-bold text-xs">₦{(p.pledge_amount || 0).toLocaleString()}</span>
                        <Badge className={`${status.color} text-xs gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                        {p.status === 'correct' && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{p.points_earned ?? 10} pts
                          </span>
                        )}
                        {p.status === 'incorrect' && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            0 pts
                          </span>
                        )}
                        <ShareButton
                          prediction={p}
                          rank={rank}
                          points={myPoints}
                          milestone={myMilestone}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}