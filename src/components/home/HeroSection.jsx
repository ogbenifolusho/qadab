import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-[-10%] w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-primary leading-tight">
            Predict for{' '}
            <span className="text-secondary">Purpose</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Qada.bet turns everyday predictions into real-world impact for verified NGOs, orphanages, and communities.
          </p>

          <p className="mt-4 text-sm sm:text-base font-semibold text-foreground">
            No gambling. No winnings.{' '}
            <span className="text-muted-foreground font-normal">Only measurable social change.</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/predict">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8 py-6 gap-2 font-bold rounded-xl">
                Start Making Impact
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/donate">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 border-secondary text-lg px-8 py-6 font-bold rounded-xl">
                <Heart className="w-5 h-5 mr-2" />
                Donate
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            * <strong>QADA</strong> means Quantified Action for Development and Assistance. | <strong>.bet</strong> means Believe. Engage. Transform.
          </p>
        </motion.div>
      </div>
    </section>
  );
}