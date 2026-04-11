import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Users, Gift, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const statGradients = [
  'bg-gradient-to-br from-blue-600 to-blue-800',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-emerald-500 to-emerald-700',
  'bg-gradient-to-br from-amber-500 to-yellow-600',
];

const statIcons = [Shield, Users, Gift, Zap];

export default function ImpactStats() {
  const { data: causes } = useQuery({
    queryKey: ['causes'],
    queryFn: () => base44.entities.Cause.list(),
    initialData: [],
  });

  const { data: donations } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list(),
    initialData: [],
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.Prediction.list(),
    initialData: [],
  });

  const totalPledged = predictions.reduce((sum, p) => sum + (p.pledge_amount || 0), 0);
  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalImpact = totalPledged + totalDonated;

  const stats = [
    { label: 'Verified Causes', value: causes.length },
    { label: 'Amount Pledged', value: `₦${totalPledged.toLocaleString()}` },
    { label: 'Amount Donated', value: `₦${totalDonated.toLocaleString()}` },
    { label: 'Impact So Far', value: `₦${totalImpact.toLocaleString()}` },
  ];

  return (
    <section className="py-16 sm:py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-12">
          Live Impact Dashboard
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = statIcons[i];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${statGradients[i]} rounded-2xl p-5 sm:p-8 text-white text-center shadow-lg`}
              >
                <Icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <p className="text-2xl sm:text-3xl font-extrabold">{stat.value}</p>
                <p className="text-sm sm:text-base mt-1 opacity-80">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}