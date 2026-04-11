import React from 'react';
import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-primary mb-2">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 2026</p>
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-lg font-bold mb-2">1. About Qada.Bet</h2>
              <p className="text-muted-foreground">Qada.Bet is a social impact platform operated by Qada Technologies. It is NOT a gambling platform. Users do not win money. All activated pledges go directly to verified causes.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">2. Eligibility</h2>
              <p className="text-muted-foreground">You must be at least 18 years old to use Qada.Bet. By using the platform, you confirm you meet this requirement.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">3. Predictions & Pledges</h2>
              <p className="text-muted-foreground">When you make a prediction, you pledge a fixed amount. If your prediction is correct, that amount is donated to your chosen cause. If incorrect, nothing is charged. Pledges are voluntary commitments to social good.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">4. Donations & Service Fee</h2>
              <p className="text-muted-foreground">Direct donations are processed securely via Paystack. A 5% platform service fee is deducted from cause payouts to cover verification, payment processing, and platform operations. Donors may also voluntarily add an optional tip to support platform sustainability. See our <a href="/pricing" className="text-primary">Pricing page</a> for full details.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">5. User Conduct</h2>
              <p className="text-muted-foreground">You agree not to misuse the platform, create false accounts, or attempt to manipulate predictions or results.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">6. Contact</h2>
              <p className="text-muted-foreground">For questions, contact us at <a href="mailto:hello@qada.bet" className="text-primary">hello@qada.bet</a>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}