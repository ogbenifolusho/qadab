import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            Turn Your Next Prediction Into{' '}
            <span className="text-secondary">Real Change</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base sm:text-lg">
            One correct pick can feed a child, fund education, or rebuild a community.
          </p>
          <Link to="/predict">
            <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-lg px-10 py-6 gap-2 font-bold rounded-xl">
              Join the Movement Now <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}