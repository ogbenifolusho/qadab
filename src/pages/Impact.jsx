import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Shield, Users, Gift, Zap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import RealTimeFeed from '@/components/RealTimeFeed';
import DonorAchievements from '@/components/DonorAchievements';

const statGradients = [
  'bg-gradient-to-br from-blue-600 to-blue-800',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-emerald-500 to-emerald-700',
  'bg-gradient-to-br from-amber-500 to-yellow-600',
];

export default function Impact() {
  const { data: donations } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-created_date'),
    initialData: [],
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.Prediction.list('-created_date'),
    initialData: [],
  });

  const { data: causes } = useQuery({
    queryKey: ['causes'],
    queryFn: () => base44.entities.Cause.list(),
    initialData: [],
  });

  const totalPledged = predictions.reduce((sum, p) => sum + (p.pledge_amount || 0), 0);
  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const correctPredictions = predictions.filter(p => p.status === 'correct').length;

  const stats = [
    { icon: Shield, label: 'Verified Causes', value: causes.length, gradient: statGradients[0] },
    { icon: Users, label: 'Total Pledged', value: `₦${totalPledged.toLocaleString()}`, gradient: statGradients[1] },
    { icon: Gift, label: 'Total Donated', value: `₦${totalDonated.toLocaleString()}`, gradient: statGradients[2] },
    { icon: Zap, label: 'Correct Predictions', value: correctPredictions, gradient: statGradients[3] },
  ];

  return (
    <div>
      <section className="py-16 sm:py-24 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              Impact <span className="text-secondary">Dashboard</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">
              Track the real-world change created by the Qada.bet community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${s.gradient} rounded-2xl p-5 sm:p-6 text-white text-center shadow-lg`}
              >
                <s.icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
                <p className="text-xl sm:text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs sm:text-sm mt-1 opacity-80">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donor Achievements */}
      <DonorAchievements />

      {/* Live Feed */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RealTimeFeed />
        </div>
      </section>
    </div>
  );
}