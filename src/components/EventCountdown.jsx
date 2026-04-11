import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function getTimeLeft(eventDate) {
  const diff = new Date(eventDate) - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function EventCountdown({ eventDate }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(eventDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(eventDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  if (!eventDate) return null;
  if (!timeLeft) return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" /> Event started
    </div>
  );

  const units = [
    { label: 'D', value: timeLeft.days },
    { label: 'H', value: timeLeft.hours },
    { label: 'M', value: timeLeft.minutes },
    { label: 'S', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3 text-primary shrink-0" />
      <div className="flex items-center gap-1">
        {units.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-0.5">
            <span className="bg-primary/10 text-primary text-xs font-bold rounded px-1 py-0.5 min-w-[22px] text-center tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
            {label !== 'S' && <span className="text-muted-foreground text-xs">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}