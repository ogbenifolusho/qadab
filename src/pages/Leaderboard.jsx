import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Medal, Trophy, Crown, Loader2, Share2, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSharePrediction } from '@/hooks/useSharePrediction';
import { calcPoints, getMilestone, getNextMilestone, MILESTONES } from '@/lib/scoring';
import { Progress } from '@/components/ui/progress';

const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
const rankBgs = ['bg-yellow-50 border-yellow-200', 'bg-slate-50 border-slate-200', 'bg-amber-50 border-amber-200'];

/** Mask a name: show first 2 chars + stars, e.g. "Jo** Do**" */
function maskName(name) {
  if (!name) return '***';
  return name
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word + '*';
      return word.slice(0, 2) + '*'.repeat(Math.min(word.length - 2, 3));
    })
    .join(' ');
}

export default function Leaderboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const { shareRank } = useSharePrediction();

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) base44.auth.me().then(setCurrentUser);
    });
  }, []);

  const { data: allPredictions, isLoading: loadingPreds } = useQuery({
    queryKey: ['all-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
    initialData: [],
  });

  const { data: allDonations, isLoading: loadingDons } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list(),
    initialData: [],
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const isLoading = loadingPreds || loadingDons;

  const userMap = {};
  allUsers.forEach(u => { userMap[u.email] = u.full_name || u.email; });

  // Aggregate per-user stats
  const statsMap = {};
  allPredictions.forEach(p => {
    const key = p.created_by;
    if (!key) return;
    if (!statsMap[key]) statsMap[key] = { correct: 0, total: 0, pledged: 0, donated: 0 };
    statsMap[key].total++;
    statsMap[key].pledged += p.pledge_amount || 0;
    if (p.status === 'correct') statsMap[key].correct++;
  });
  allDonations.forEach(d => {
    const key = d.created_by;
    if (!key) return;
    if (!statsMap[key]) statsMap[key] = { correct: 0, total: 0, pledged: 0, donated: 0 };
    if (d.payment_status === 'success') statsMap[key].donated += d.amount || 0;
  });

  // Full ranked leaderboard
  const fullLeaderboard = Object.entries(statsMap)
    .map(([email, s]) => ({
      email,
      name: userMap[email] || email.split('@')[0],
      correct: s.correct,
      total: s.total,
      pledged: s.pledged,
      donated: s.donated,
      points: calcPoints({ correctPredictions: s.correct, totalDonated: s.donated }),
    }))
    .sort((a, b) => b.points - a.points || b.correct - a.correct);

  // Find current user's real rank (1-indexed)
  const myRealRankIndex = fullLeaderboard.findIndex(e => e.email === currentUser?.email);
  const myEntry = myRealRankIndex >= 0 ? fullLeaderboard[myRealRankIndex] : null;
  const myRealRank = myRealRankIndex + 1; // 1-indexed

  // Build display list: top 10, then append current user if not in top 10
  const top10 = fullLeaderboard.slice(0, 10);
  const isInTop10 = myRealRankIndex >= 0 && myRealRankIndex < 10;

  // displayList: entries with their real rank index
  const displayList = isInTop10 || !myEntry
    ? top10.map((e, i) => ({ ...e, realRankIndex: i }))
    : [
        ...top10.map((e, i) => ({ ...e, realRankIndex: i })),
        { ...myEntry, realRankIndex: myRealRankIndex },
      ];

  return (
    <div>
      <section className="py-16 sm:py-24 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              <Crown className="inline w-10 h-10 text-secondary mb-1 mr-2" />
              Leaderboard
            </h1>
            <p className="mt-4 text-muted-foreground">Top impact-makers ranked by points.</p>
            <div className="mt-5 inline-flex gap-4 bg-card border rounded-xl px-5 py-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="w-4 h-4 text-amber-500" />
                <strong className="text-foreground">10pts</strong> per correct prediction
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <strong className="text-foreground">1pt</strong> per ₦500 donated
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* My milestone card */}
      {myEntry && (
        <div className="max-w-2xl mx-auto px-4 mb-2">
          <MyMilestoneCard entry={myEntry} rank={myRealRank} />
        </div>
      )}

      <section className="py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : fullLeaderboard.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No predictions yet. Be the first!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayList.map((entry, listIndex) => {
                const i = entry.realRankIndex;
                const isMe = currentUser?.email === entry.email;
                const isPinnedMe = !isInTop10 && myEntry && listIndex === displayList.length - 1 && isMe;
                const milestone = getMilestone(entry.points);
                const displayName = isMe ? entry.name : maskName(entry.name);

                return (
                  <React.Fragment key={entry.email}>
                    {/* Separator before pinned current user */}
                    {isPinnedMe && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground">your rank</span>
                        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: listIndex * 0.04 }}
                    >
                      <Card className={`p-4 border transition-all ${
                        isMe
                          ? 'ring-2 ring-primary shadow-lg shadow-primary/10 bg-primary/5 border-primary/30'
                          : i < 3 ? rankBgs[i] : ''
                      }`}>
                        <div className="flex items-center gap-3">
                          {/* Rank */}
                          <div className="w-9 text-center shrink-0">
                            {i < 3 ? (
                              <Medal className={`w-6 h-6 mx-auto ${medalColors[i]}`} />
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate flex items-center gap-2 flex-wrap">
                              {displayName}
                              {isMe && <Badge className="text-xs bg-primary/10 text-primary border-0">You</Badge>}
                              {milestone && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${milestone.color}`}>
                                  {milestone.badge}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.correct} correct · ₦{entry.donated.toLocaleString()} donated
                            </p>
                          </div>

                          {/* Points & share */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-baseline gap-1">
                              <p className={`text-xl font-extrabold ${isMe ? 'text-primary' : 'text-foreground'}`}>{entry.points}</p>
                              <p className="text-xs text-muted-foreground">pts</p>
                            </div>
                            {isMe && (
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs px-2"
                                onClick={() => shareRank({
                                  rank: i + 1,
                                  correct: entry.correct,
                                  total: entry.total,
                                  points: entry.points,
                                  milestone,
                                })}>
                                <Share2 className="w-3 h-3" /> Share
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Milestones legend */}
          <Card className="mt-10 p-5">
            <p className="text-sm font-bold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-secondary" /> Milestone Badges</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MILESTONES.map(m => (
                <div key={m.points} className={`rounded-lg px-3 py-2 text-xs font-semibold ${m.color} flex items-center justify-between`}>
                  <span>{m.badge}</span>
                  <span className="opacity-70">{m.points}+ pts</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MyMilestoneCard({ entry, rank }) {
  const milestone = getMilestone(entry.points);
  const next = getNextMilestone(entry.points);
  const prevPoints = milestone?.points || 0;
  const progress = next
    ? Math.round(((entry.points - prevPoints) / (next.points - prevPoints)) * 100)
    : 100;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 bg-primary/5 border-primary/20 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Your Standing</p>
            <p className="text-2xl font-extrabold text-primary">{entry.points} pts · #{rank}</p>
          </div>
          {milestone && (
            <span className={`text-sm px-3 py-1.5 rounded-full font-bold ${milestone.color}`}>
              {milestone.badge}
            </span>
          )}
        </div>
        {next ? (
          <>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{entry.points} pts</span>
              <span>Next: {next.badge} at {next.points} pts</span>
            </div>
            <Progress value={progress} className="h-2" />
          </>
        ) : (
          <p className="text-xs text-primary font-semibold">🌍 You've reached the highest milestone!</p>
        )}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>✅ {entry.correct} correct predictions</span>
          <span>💰 ₦{entry.donated.toLocaleString()} donated</span>
        </div>
      </Card>
    </motion.div>
  );
}