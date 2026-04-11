import React from 'react';
import HeroSection from '../components/home/HeroSection';
import ImpactStats from '../components/home/ImpactStats';
import HowItWorks from '../components/home/HowItWorks';
import CausesPreview from '../components/home/CausesPreview';
import CTASection from '../components/home/CTASection';
import RealTimeFeed from '@/components/RealTimeFeed';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <ImpactStats />
      <section className="py-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RealTimeFeed />
        </div>
      </section>
      <HowItWorks />
      <CausesPreview />
      <CTASection />
    </div>
  );
}