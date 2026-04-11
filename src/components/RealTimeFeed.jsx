import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Trophy } from 'lucide-react';

function maskName(name) {
  if (!name) return 'An***ymous';
  const parts = name.trim().split(' ');
  const mask = (word) => {
    if (word.length <= 2) return word[0] + '*';
    return word[0] + word[1] + '*'.repeat(Math.max(2, word.length - 2));
  };
  return parts.map(mask).join(' ');
}

function FeedItem({ item }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap mx-6">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        item.type === 'donation' ? 'bg-emerald-100' : 'bg-primary/10'
      }`}>
        {item.type === 'donation'
          ? <Gift className="w-3 h-3 text-emerald-600" />
          : <Trophy className="w-3 h-3 text-primary" />}
      </span>
      <span className="text-sm">
        <span className="font-semibold">{maskName(item.name)}</span>{' '}
        {item.type === 'donation' ? (
          <>donated <span className="text-emerald-600 font-bold">₦{(item.amount || 0).toLocaleString()}</span> to <span className="font-medium">{item.cause}</span></>
        ) : (
          <>predicted on <span className="font-medium">{item.event}</span>{item.cause && <> for <span className="font-medium">{item.cause}</span></>}</>
        )}
      </span>
      <span className="text-muted-foreground text-xs mx-2">•</span>
    </span>
  );
}

export default function RealTimeFeed() {
  const [feed, setFeed] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Donation.list('-created_date', 8),
      base44.entities.Prediction.list('-created_date', 8),
    ]).then(([donations, predictions]) => {
      const items = [
        ...donations.map(d => ({
          id: `d-${d.id}`,
          type: 'donation',
          name: d.donor_name || 'Anonymous',
          amount: d.amount,
          cause: d.cause_name,
          date: d.created_date,
        })),
        ...predictions.map(p => ({
          id: `p-${p.id}`,
          type: 'prediction',
          name: p.created_by ? p.created_by.split('@')[0] : 'Someone',
          event: p.event_title,
          cause: p.cause_name,
          pledge: p.pledge_amount,
          date: p.created_date,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
      setFeed(items);
    });

    const unsubDonation = base44.entities.Donation.subscribe((event) => {
      if (event.type === 'create') {
        const d = event.data;
        setFeed(prev => [{
          id: `d-${d.id}`,
          type: 'donation',
          name: d.donor_name || 'Anonymous',
          amount: d.amount,
          cause: d.cause_name,
          date: d.created_date || new Date().toISOString(),
        }, ...prev].slice(0, 12));
      }
    });

    const unsubPrediction = base44.entities.Prediction.subscribe((event) => {
      if (event.type === 'create') {
        const p = event.data;
        setFeed(prev => [{
          id: `p-${p.id}`,
          type: 'prediction',
          name: p.created_by ? p.created_by.split('@')[0] : 'Someone',
          event: p.event_title,
          cause: p.cause_name,
          pledge: p.pledge_amount,
          date: p.created_date || new Date().toISOString(),
        }, ...prev].slice(0, 12));
      }
    });

    return () => { unsubDonation(); unsubPrediction(); };
  }, []);

  if (feed.length === 0) return null;

  // Duplicate items for seamless loop
  const doubled = [...feed, ...feed];

  return (
    <div className="w-full border-y border-border bg-card/60 py-3 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Impact Feed</span>
      </div>

      {/* Scrolling ticker */}
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-card/60 to-transparent" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-card/60 to-transparent" />

        <div
          ref={trackRef}
          className="flex animate-ticker"
          style={{ width: 'max-content' }}
        >
          {doubled.map((item, idx) => (
            <FeedItem key={`${item.id}-${idx}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}