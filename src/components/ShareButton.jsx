import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Copy, Check } from 'lucide-react';
import { useSharePrediction } from '@/hooks/useSharePrediction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ShareButton({ prediction, rank, points, milestone, size = 'sm' }) {
  const { share, copyLink } = useSharePrediction();
  const [copied, setCopied] = useState(false);

  const outcomeLabel = prediction.selected_outcome;
  const milestoneText = milestone ? ` · ${milestone.badge}` : '';
  const rankText = rank ? ` · Rank #${rank}` : '';
  const pointsText = points ? ` · ${points} pts` : '';
  const shareText = `🎯 I predicted "${outcomeLabel}" on ${prediction.event_title} — supporting ${prediction.cause_name}${rankText}${pointsText}${milestoneText}. Join me on qada.bet #QadaBet`;

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin + '/predict')}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = () => {
    share({
      event: prediction.event_title,
      outcome: prediction.selected_outcome,
      cause: prediction.cause_name,
      pledge: prediction.pledge_amount,
      rank,
      status: prediction.status,
      points,
      milestone,
    });
  };

  const handleCopy = () => {
    copyLink(shareText + '\n' + window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleNativeShare}>
          <Share2 className="w-4 h-4 mr-2" /> Share via...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter}>
          <Twitter className="w-4 h-4 mr-2" /> Post on X / Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy text'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}