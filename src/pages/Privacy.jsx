import React from 'react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-primary mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 2026</p>
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-lg font-bold mb-2">1. Information We Collect</h2>
              <p className="text-muted-foreground">We collect your name, email address, and payment information when you donate or register. We also collect prediction data to track your impact.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">Your information is used to process donations, send receipts, notify you of prediction results, and display your impact on the leaderboard (anonymized if preferred).</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">3. Data Sharing</h2>
              <p className="text-muted-foreground">We do not sell your personal data. We share payment data with Paystack solely to process transactions. Cause partners receive only aggregate donation amounts.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">4. Cookies</h2>
              <p className="text-muted-foreground">We use cookies for authentication and analytics. You can disable cookies in your browser but some features may not work.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">5. Data Security</h2>
              <p className="text-muted-foreground">We use industry-standard encryption and security practices to protect your data.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2">6. Contact</h2>
              <p className="text-muted-foreground">For privacy concerns, contact <a href="mailto:hello@qada.bet" className="text-primary">hello@qada.bet</a>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}