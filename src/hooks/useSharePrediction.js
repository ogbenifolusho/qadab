import { toast } from 'sonner';

export function useSharePrediction() {
  const share = ({ event, outcome, cause, pledge, rank, status, points, milestone }) => {
    const rankText = rank && rank > 0 ? `\n🏆 My rank: #${rank}` : '';
    const pointsText = points ? `\n⭐ My points: ${points} pts` : '';
    const milestoneText = milestone ? `\n${milestone.badge}` : '';
    const statusText = status === 'correct' ? ' ✅ (Correct!)' : status === 'incorrect' ? ' ❌ (Incorrect)' : '';
    const text = `🎯 I just predicted on Qada.Bet!

📌 Event: ${event}
✅ My Pick: ${outcome}${statusText}
❤️ Cause: ${cause}
💰 Pledge: ₦${Number(pledge).toLocaleString()}${rankText}${pointsText}${milestoneText}

Not gambling — pure social impact. If I'm right, ₦${Number(pledge).toLocaleString()} goes to ${cause}.
Earned on qada.bet 🌍 #QadaBet #SocialImpact #PredictForPurpose`;

    const url = window.location.origin + '/predict';

    if (navigator.share) {
      navigator.share({ title: 'My Qada.Bet Prediction', text, url }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const shareRank = ({ rank, correct, total, points, milestone }) => {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const milestoneText = milestone ? `\n${milestone.badge}` : '';
    const text = `🏆 I'm ranked #${rank} on Qada.Bet!${milestoneText}

📊 My stats:
⭐ Total Points: ${points} pts
✅ Correct Predictions: ${correct}/${total} (${accuracy}% accuracy)

I earned these points by predicting events & donating to verified causes on qada.bet.
Every correct pick funds real social impact 💚
Join me at qada.bet #QadaBet #SocialImpact #PredictForPurpose`;

    const url = window.location.origin + '/leaderboard';

    if (navigator.share) {
      navigator.share({ title: 'My Qada.Bet Ranking', text, url }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const copyLink = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    });
  };

  return { share, shareRank, copyLink };
}