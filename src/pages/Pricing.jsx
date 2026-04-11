import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Heart, ArrowRight, Percent, Gift, Users } from 'lucide-react';

const tiers = [
  {
    title: 'Free for Donors',
    price: '₦0',
    desc: 'Anyone can donate directly to a cause — no account required.',
    features: [
      'No account needed to donate',
      'Choose any verified cause',
      'Instant payment via Paystack',
      'Optional platform tip',
      'Email donation receipt',
    ],
    cta: 'Donate Now',
    href: '/donate',
    highlight: false,
  },
  {
    title: 'Predictor (Free)',
    price: '₦0',
    desc: 'Make impact predictions tied to football outcomes. Fully free.',
    features: [
      'All donor features',
      'Make predictions on football events',
      'Pledge donations conditionally',
      'Earn points & unlock badges',
      'Leaderboard ranking',
      'Impact history dashboard',
    ],
    cta: 'Get Started',
    href: '/predict',
    highlight: true,
  },
  {
    title: 'Cause Manager',
    price: '5% Fee',
    desc: 'Register your NGO or cause and receive donations from our community.',
    features: [
      'Cause listing on the platform',
      'Receive direct & prediction donations',
      'Dedicated beneficiary dashboard',
      'Withdrawal request system',
      'Verified badge on your cause',
      '5% platform service fee on payouts',
    ],
    cta: 'Register a Cause',
    href: '/start-cause',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Why do you charge 5% on payouts?',
    a: "Running a trusted, secure and scalable platform costs money. The 5% platform service fee covers payment processing (Paystack), hosting, engineering, cause verification, fraud prevention, and team operations. This is deducted only at payout — we never take money from donations before they reach our books.",
  },
  {
    q: 'What is the optional tip for?',
    a: "When donors make a direct donation, we display an optional tip field. This is entirely voluntary and goes directly to keeping the platform alive — servers, maintenance, and team salaries. Even a small tip helps us keep the service free for everyone.",
  },
  {
    q: 'Do predictors pay anything?',
    a: "No. Predictions are free. The only money involved is the pledge you commit to donating if your prediction is correct. That amount goes 100% to your chosen cause.",
  },
  {
    q: 'Can companies sponsor or donate to the platform?',
    a: "Absolutely! We welcome sponsors, corporate donors, and impact investors who want to support the mission of Qada.Bet. Your sponsorship helps us grow and reach more causes and communities.",
  },
];

export default function Pricing() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-secondary/20 text-secondary font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5">
              Transparent Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              Simple. Fair. <span className="text-secondary">Transparent.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Qada.Bet is free to use for donors and predictors. We charge a small service fee only when cause managers receive payouts — so you always know where your money goes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-7 flex flex-col ${
                tier.highlight
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xl scale-105'
                  : 'bg-card border-border'
              }`}
            >
              {tier.highlight && (
                <span className="inline-block bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 w-fit">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-extrabold mb-1">{tier.title}</h2>
              <p className="text-3xl font-black my-3">{tier.price}</p>
              <p className={`text-sm mb-5 ${tier.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {tier.desc}
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${tier.highlight ? 'text-secondary' : 'text-emerald-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={tier.href}>
                <Button className={`w-full font-bold gap-2 ${
                  tier.highlight
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}>
                  {tier.cta} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why 5% section */}
      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Percent className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl font-extrabold mb-5">Why the 5% Fee?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We're committed to maximum impact. Out of every ₦100 donated to a cause, <strong className="text-foreground">₦95 goes directly to that cause</strong>. The remaining ₦5 covers the real costs of running a trusted platform:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left mt-8">
            {[
              { icon: '🔒', title: 'Security & Compliance', desc: 'Secure payments, fraud prevention, KYC verification for cause managers' },
              { icon: '⚙️', title: 'Platform Operations', desc: 'Hosting, engineering, technical support and continuous improvement' },
              { icon: '✅', title: 'Cause Verification', desc: 'Human review of documents, CAC checks, and ongoing monitoring of cause activities' },
            ].map(item => (
              <div key={item.title} className="bg-background rounded-xl p-5 border border-border">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsor/Support section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold mb-5">Want to Support Our Mission?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We deeply appreciate sponsors, donors, and companies who want to invest in the infrastructure of social good. Your support helps us keep the platform free for predictors and donors, expand to more causes, and build tools that drive real impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/donate">
              <Button size="lg" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8">
                <Heart className="w-5 h-5" /> Donate to the Platform
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="gap-2 font-bold px-8">
                <Users className="w-5 h-5" /> Partner With Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-card">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-10">Pricing FAQs</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-background border border-border rounded-xl p-6"
              >
                <h3 className="font-bold mb-2 text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}