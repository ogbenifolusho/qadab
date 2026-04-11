import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ImpactCard({ cause, donorName, amount, onClose }) {
  const cardRef = useRef(null);

  const handleShare = async () => {
    const url = `${window.location.origin}/causes/${cause.id}`;
    const text = `I just donated ₦${Number(amount).toLocaleString()} to "${cause.name}" on Qada.Bet! Every prediction and donation creates real-world impact. Join me: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `I supported ${cause.name}`, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Impact message copied! Paste it anywhere to share.');
    }
  };

  const categoryEmojis = {
    shelter: '🏠', education: '📚', water: '💧', health: '❤️‍🩹', food: '🌾', environment: '🌿'
  };
  const emoji = categoryEmojis[cause.category] || '💚';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Impact Card Visual */}
        <div ref={cardRef} className="bg-gradient-to-br from-[#1a237e] to-[#283593] p-8 text-white text-center relative">
          <div className="absolute top-3 right-3">
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-5xl mb-3">{emoji}</div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Impact Card</p>
          <p className="text-lg font-extrabold leading-tight mb-1">{donorName || 'Anonymous'}</p>
          <p className="text-white/70 text-sm mb-4">supported</p>
          <p className="text-xl font-extrabold text-yellow-400 leading-tight mb-3">{cause.name}</p>
          <div className="bg-white/10 rounded-2xl px-6 py-3 inline-block mb-4">
            <p className="text-3xl font-black text-yellow-300">₦{Number(amount).toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-0.5">donated</p>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
            <p className="text-xs text-white/60 font-semibold">qada.bet</p>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-center text-muted-foreground">Share your impact and inspire others to give!</p>
          <Button className="w-full gap-2 font-bold" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share My Impact
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}