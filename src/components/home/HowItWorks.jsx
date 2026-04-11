import React from 'react';
import { CalendarDays, MousePointerClick, Heart, Wallet, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: CalendarDays, title: 'Choose an event', desc: 'Football, elections, milestones' },
  { icon: MousePointerClick, title: 'Make your pick', desc: 'Predict the outcome' },
  { icon: Heart, title: 'Select a cause', desc: 'Verified NGOs & orphanages' },
  { icon: Wallet, title: 'Enter your pledge', desc: '₦ amount if correct' },
  { icon: Sparkles, title: 'Impact delivered!', desc: 'Correct = donation sent' },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-14">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative text-center"
            >
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="absolute -top-2 -left-2 w-7 h-7 bg-secondary rounded-full text-xs font-bold flex items-center justify-center text-secondary-foreground shadow">
                  {i + 1}
                </span>
                <step.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center space-y-2 text-base">
          <p className="text-muted-foreground">
            Wrong prediction? <strong className="text-foreground">Nothing is taken.</strong>
          </p>
          <p className="text-muted-foreground">
            Correct prediction? <strong className="text-secondary">A community wins.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}