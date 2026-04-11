import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, CheckCircle2, XCircle, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/ShareButton';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  correct: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Correct' },
  incorrect: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Incorrect' },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
};

export default function MyPredictions() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['my-predictions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Prediction.filter({ created_by: user.email }, '-created_date');
    },
    initialData: [],
  });

  const correct = predictions.filter(p => p.status === 'correct').length;
  const total = predictions.length;
  const rank = null; // would need full leaderboard data; omit for simplicity

  return (
    <div>
      <section className="py-16 sm:py-20 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">My Predictions</h1>
            <p className="mt-3 text-muted-foreground">Track your predictions and impact.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4">
          {predictions.length === 0 ? (
            <Card className="p-10 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-4">You haven't made any predictions yet.</p>
              <Link to="/predict">
                <Button className="gap-2">
                  <Heart className="w-4 h-4" /> Make Your First Prediction
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {predictions.map((p, i) => {
                const status = statusConfig[p.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{p.event_title || 'Event'}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Pick: <strong>{p.selected_outcome}</strong> • Cause: <strong>{p.cause_name}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                           <span className="font-bold text-sm">₦{(p.pledge_amount || 0).toLocaleString()}</span>
                           <Badge className={`${status.color} text-xs gap-1`}>
                             <StatusIcon className="w-3 h-3" />
                             {status.label}
                           </Badge>
                           <ShareButton prediction={p} />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}