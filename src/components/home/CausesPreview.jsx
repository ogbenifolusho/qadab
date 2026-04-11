import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CauseCard from '../causes/CauseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CausesPreview() {
  const { data: causes } = useQuery({
    queryKey: ['causes'],
    queryFn: () => base44.entities.Cause.list(),
    initialData: [],
  });

  return (
    <section className="py-16 sm:py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-4">
          Verified Causes on Qada.bet
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Every prediction supports a real, verified cause.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {causes.slice(0, 3).map(cause => (
            <CauseCard key={cause.id} cause={cause} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/causes">
            <Button variant="outline" className="gap-2 font-semibold">
              View All Causes <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}