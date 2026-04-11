import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Eye, Clock, ChevronDown } from 'lucide-react';
import HowItWorks from '../components/home/HowItWorks';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: 'Is Qada.bet a betting site?', a: 'No. There are no winnings, no odds, no payouts. It\'s a conditional donation platform for social good.' },
  { q: 'What happens if I\'m wrong?', a: 'Nothing. No money is taken from you.' },
  { q: 'Where does the money go?', a: 'Directly to verified NGOs, orphanages, and community projects.' },
  { q: 'How do I know my donation was made?', a: 'Every correct prediction creates a public impact receipt.' },
  { q: 'Why .bet in the name?', a: '.bet = Believe. Engage. Transform. It\'s about commitment, not gambling.' },
];

const transparencyItems = [
  { icon: Shield, text: 'Every pledge creates a public receipt' },
  { icon: Eye, text: 'All causes independently verified' },
  { icon: Clock, text: 'Every outcome time-stamped & auditable' },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              About Qada<span className="text-secondary">.bet</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
              We turn everyday predictions into <strong className="text-foreground">real-world impact</strong> for verified NGOs, orphanages, and communities.
            </p>
            <p className="mt-4 font-semibold">
              No gambling. No winnings. <span className="text-muted-foreground font-normal">Only measurable social change.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* What is QADA */}
      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl font-extrabold text-primary-foreground">Q</span>
          </div>
          <h2 className="text-3xl font-extrabold mb-6">What is QADA?</h2>
          <p className="text-muted-foreground mb-4">
            QADA stands for <strong className="text-foreground">Quantified Action for Development and Assistance</strong>.
          </p>
          <p className="text-muted-foreground mb-4">
            Qada.bet is a social impact platform where anyone can make simple outcome predictions and attach a conditional donation to their pick.
          </p>
          <p className="text-muted-foreground mb-2">
            When your prediction is correct — the money goes directly to a verified cause.
          </p>
          <p className="text-muted-foreground">
            When it's wrong — nothing is charged.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            On Qada, <strong className="text-secondary">.bet</strong> means Believe. Engage. Transform.
          </p>
        </div>
      </section>

      <HowItWorks />

      {/* Transparency */}
      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-10">Transparency Is Our Core</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {transparencyItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-background border border-border"
              >
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-card">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Ready to Make a Difference?</h2>
        <Link to="/predict">
          <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-lg px-10 py-6 gap-2 font-bold rounded-xl">
            Join Qada.bet Today <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}