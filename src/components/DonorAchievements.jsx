import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const DONATION_TIERS = [
  { min: 0,      max: 4999,    emoji: '🌱', label: 'Seedling',    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',    desc: 'First steps to change' },
  { min: 5000,   max: 19999,   emoji: '🌿', label: 'Supporter',   color: 'bg-green-100 text-green-800 border-green-300',          desc: 'Growing impact' },
  { min: 20000,  max: 49999,   emoji: '⭐', label: 'Champion',    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',       desc: 'Making waves' },
  { min: 50000,  max: 99999,   emoji: '🏆', label: 'Hero',        color: 'bg-amber-100 text-amber-800 border-amber-300',          desc: 'Community hero' },
  { min: 100000, max: 499999,  emoji: '💎', label: 'Philanthropist', color: 'bg-blue-100 text-blue-800 border-blue-300',        desc: 'Elite giver' },
  { min: 500000, max: Infinity, emoji: '👑', label: 'Legend',     color: 'bg-purple-100 text-purple-800 border-purple-300',       desc: 'Legendary impact' },
];

function getTier(amount) {
  return DONATION_TIERS.find(t => amount >= t.min && amount <= t.max) || DONATION_TIERS[0];
}

function maskName(name) {
  if (!name || name === 'Anonymous') return 'Anonymous';
  const parts = name.trim().split(' ');
  return parts.map(p => p.length > 2 ? p[0] + '*'.repeat(p.length - 2) + p[p.length - 1] : p[0] + '*').join(' ');
}

export default function DonorAchievements() {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donor-achievements'],
    queryFn: () => base44.entities.Donation.filter({ payment_status: 'success' }),
  });

  // Aggregate by donor name (or email as fallback)
  const donorMap = {};
  donations.forEach(d => {
    const key = d.donor_email || d.donor_name || 'Anonymous';
    if (!donorMap[key]) {
      donorMap[key] = { name: d.donor_name || 'Anonymous', email: d.donor_email, total: 0, count: 0 };
    }
    donorMap[key].total += d.amount || 0;
    donorMap[key].count++;
  });

  const donors = Object.values(donorMap).sort((a, b) => b.total - a.total).slice(0, 20);

  // Count donors per tier
  const tierCounts = DONATION_TIERS.map(t => ({
    ...t,
    count: Object.values(donorMap).filter(d => d.total >= t.min && d.total <= t.max).length,
  }));

  return (
    <section className="py-16 sm:py-20 bg-card">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block bg-secondary/20 text-secondary font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            Donor Hall of Fame
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Our Amazing Donors</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Every donation earns an achievement. Your generosity — big or small — is celebrated here.
            No account required to earn a badge.
          </p>
        </div>

        {/* Tier badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {tierCounts.map(tier => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`rounded-xl border p-4 text-center ${tier.color}`}
            >
              <div className="text-3xl mb-1">{tier.emoji}</div>
              <p className="font-extrabold text-sm">{tier.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{tier.desc}</p>
              <p className="font-bold text-lg mt-1">{tier.count}</p>
              <p className="text-xs opacity-60">donors</p>
            </motion.div>
          ))}
        </div>

        {/* Tier requirements */}
        <div className="bg-background border border-border rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Achievement Tiers</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DONATION_TIERS.map(t => (
              <div key={t.label} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{t.emoji}</span>
                <div>
                  <span className="font-semibold">{t.label}</span>
                  <span className="text-muted-foreground ml-1 text-xs">
                    {t.min === 0 ? 'Up to ₦4,999' : t.max === Infinity ? `₦${t.min.toLocaleString()}+` : `₦${t.min.toLocaleString()} – ₦${t.max.toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top donors wall */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading donors...</div>
        ) : donors.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-5">Top Donors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((donor, i) => {
                const tier = getTier(donor.total);
                return (
                  <motion.div
                    key={donor.email || donor.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 bg-background border border-border rounded-xl p-4"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-2 ${tier.color}`}>
                      {tier.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{maskName(donor.name)}</p>
                      <p className="text-xs text-muted-foreground">{tier.label} · {donor.count} donation{donor.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-sm font-extrabold text-primary shrink-0">₦{donor.total.toLocaleString()}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}