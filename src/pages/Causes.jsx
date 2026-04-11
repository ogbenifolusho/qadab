import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CauseCard from '../components/causes/CauseCard';
import CauseAnalytics from '../components/causes/CauseAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Causes() {
  const { data: causes, isLoading } = useQuery({
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
    queryKey: ['all-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
    initialData: [],
  });

  return (
    <div>
      <section className="py-16 sm:py-24 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              Verified Causes
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">
              Every prediction on Qada.bet supports a real, verified cause.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Tabs defaultValue="causes">
            <TabsList className="mb-8">
              <TabsTrigger value="causes">All Causes</TabsTrigger>
              <TabsTrigger value="analytics">Impact Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="causes">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-80 rounded-2xl" />
                  ))}
                </div>
              ) : (() => {
                const approvedCauses = causes.filter(c => c.status === 'approved' || (c.status === undefined && c.is_verified));
                const sorted = approvedCauses.sort((a, b) => {
                  if (a.is_pinned && !b.is_pinned) return -1;
                  if (!a.is_pinned && b.is_pinned) return 1;
                  return new Date(b.created_date) - new Date(a.created_date);
                });
                return sorted.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <p className="text-lg">No approved causes yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sorted.map(cause => (
                      <CauseCard key={cause.id} cause={cause} />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="analytics">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
              ) : (
                <CauseAnalytics causes={causes} donations={donations} predictions={predictions} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}