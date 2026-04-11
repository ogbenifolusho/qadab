import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
  </svg>
);

const socialLinks = [
  { href: 'https://facebook.com/qadaimpact', icon: Facebook, label: 'Facebook' },
  { href: 'https://x.com/qadaimpact', icon: XIcon, label: 'X' },
  { href: 'https://instagram.com/qadaimpact', icon: Instagram, label: 'Instagram' },
  { href: 'https://tiktok.com/@qadaimpact', icon: TikTokIcon, label: 'TikTok' },
  { href: 'https://youtube.com/@qadaimpact', icon: Youtube, label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary fill-primary" />
              </div>
              <span className="text-xl font-extrabold">
                Qada<span className="text-secondary">.Bet</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Turning everyday predictions into real-world impact for verified NGOs and communities.
            </p>
            <div className="space-y-2 text-sm text-primary-foreground/70 mb-5">
              <a href="mailto:hello@qada.bet" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Mail className="w-4 h-4" /> hello@qada.bet
              </a>
              <a href="tel:+2349099996424" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4" /> +234 909 999 6424
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" /> Asokoro, Abuja, Nigeria
              </p>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-primary-foreground/10 hover:bg-secondary hover:text-primary rounded-lg flex items-center justify-center transition-colors"
                  aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <Link to="/predict" className="block hover:text-secondary transition-colors">Predict &amp; Give</Link>
              <Link to="/donate" className="block hover:text-secondary transition-colors">Donate Directly</Link>
              <Link to="/causes" className="block hover:text-secondary transition-colors">Verified Causes</Link>
              <Link to="/impact" className="block hover:text-secondary transition-colors">Impact Dashboard</Link>
              <Link to="/leaderboard" className="block hover:text-secondary transition-colors">Leaderboard</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <Link to="/about" className="block hover:text-secondary transition-colors">About Us</Link>
              <Link to="/contact" className="block hover:text-secondary transition-colors">Contact Us</Link>
              <Link to="/pricing" className="block hover:text-secondary transition-colors">Pricing</Link>
              <Link to="/start-cause" className="block hover:text-secondary transition-colors">Register a Cause</Link>
            </div>
          </div>

          {/* Definition */}
          <div>
            <h4 className="font-semibold mb-3">Definition</h4>
            <p className="text-sm text-primary-foreground/70 mb-2">
              <strong className="text-secondary">QADA</strong> = Quantified Action for Development and Assistance
            </p>
            <p className="text-sm text-primary-foreground/70">
              <strong className="text-secondary">.Bet</strong> = Believe. Engage. Transform.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-primary-foreground/20 mt-10 pt-6 space-y-3 text-center">
          <p className="text-[10px] text-primary-foreground/40 leading-relaxed max-w-3xl mx-auto">
            Qada.Bet is NOT a gambling platform. Users do not win money. All activated pledges go directly to verified causes. We convert predictions into measurable social change. Social Impact through Predictions.
          </p>
          <p className="text-xs text-primary-foreground/50">
            © 2026 Qada.Bet is a product of Qada Technologies. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-primary-foreground/50">
            <Link to="/terms" className="hover:text-secondary transition-colors">Terms of Use</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/pricing" className="hover:text-secondary transition-colors">Pricing</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}