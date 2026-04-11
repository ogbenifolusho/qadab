import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  MapPin, Heart, Share2, Trophy, ExternalLink, User, Phone, Mail,
  Banknote, CheckCircle2, ArrowLeft, RefreshCw, MessageSquare, Star
} from 'lucide-react';
import ImpactCard from '@/components/ImpactCard';
import { toast } from 'sonner';
import { format } from 'date-fns';

const categoryGradients = {
  shelter: 'from-blue-500 to-blue-700',
  education: 'from-indigo-500 to-indigo-700',
  water: 'from-cyan-500 to-cyan-700',
  health: 'from-rose-500 to-rose-700',
  food: 'from-orange-500 to-orange-700',
  environment: 'from-emerald-500 to-emerald-700',
};

export default function CausePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [donorView, setDonorView] = useState('recent');
  const [showImpactCard, setShowImpactCard] = useState(false);

  const { data: cause } = useQuery({
    queryKey: ['cause', id],
    queryFn: () => base44.entities.Cause.filter({ id }),
    select: data => data?.[0],
    enabled: !!id,
  });

  const { data: donations = [], refetch: refetchDonations } = useQuery({
    queryKey: ['cause-donations', id],
    queryFn: () => base44.entities.Donation.filter({ cause_id: id }),
    enabled: !!id,
  });

  const successDonations = donations.filter(d => d.payment_status === 'success');
  const totalDonated = successDonations.reduce((s, d) => s + (d.amount || 0), 0);
  const percentage = cause?.goal_amount ? Math.min(100, Math.round((( cause.raised_amount || 0) / cause.goal_amount) * 100)) : 0;
  const gradient = categoryGradients[cause?.category] || 'from-blue-500 to-blue-700';

  const sortedDonations = [...successDonations].sort((a, b) => {
    if (donorView === 'top') return (b.amount || 0) - (a.amount || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });
  const displayDonations = showAll ? sortedDonations : sortedDonations.slice(0, 10);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Support ${cause?.name} on Qada.Bet — every prediction helps! ${url}`;
    if (navigator.share) {
      await navigator.share({ title: cause?.name, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (!cause) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Causes
          </button>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Image */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-white/20 shrink-0 border-2 border-white/30">
              {cause.image_url ? (
                <img src={cause.image_url} alt={cause.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-white/80">
                    {cause.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0 capitalize">{cause.category}</Badge>
                {cause.is_verified && (
                  <Badge className="bg-emerald-400/30 text-emerald-100 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold mb-2">{cause.name}</h1>
              {cause.location && (
                <p className="flex items-center gap-1.5 text-white/70 text-sm mb-3">
                  <MapPin className="w-4 h-4" /> {cause.location}
                </p>
              )}
              {cause.description && (
                <p className="text-white/80 text-sm sm:text-base leading-relaxed line-clamp-3">{cause.description}</p>
              )}
              {cause.website_url && (
                <a href={cause.website_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-white/70 hover:text-white underline underline-offset-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">

        {/* Fundraising progress */}
        <Card className="p-5">
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">₦{(cause.raised_amount || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">raised of ₦{(cause.goal_amount || 0).toLocaleString()} goal</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold">{successDonations.length}</p>
              <p className="text-xs text-muted-foreground">donations</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{percentage}%</p>
              <p className="text-xs text-muted-foreground">of goal reached</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3 mb-2" />

          <div className="flex gap-3 mt-5 flex-wrap">
            <Link to={`/donate?cause_id=${cause.id}`} className="flex-1 min-w-[120px]">
              <Button className="w-full gap-2 font-bold">
                <Heart className="w-4 h-4" /> Donate Now
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 font-semibold" onClick={handleShare}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </Card>

        {/* Purpose of donation */}
        {cause.purpose && (
          <Card className="p-5">
            <h2 className="font-bold text-base mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-secondary" /> Purpose of Donation
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{cause.purpose}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Contact */}
          {(cause.contact_person || cause.contact_phone || cause.contact_email) && (
            <Card className="p-5">
              <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Contact
              </h2>
              <div className="space-y-2 text-sm">
                {cause.contact_person && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5 shrink-0" /> {cause.contact_person}
                  </p>
                )}
                {cause.contact_phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {cause.contact_phone}
                  </p>
                )}
                {cause.contact_email && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {cause.contact_email}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Predict to support */}
          <Card className="p-5 bg-primary/5 border-primary/20">
            <h2 className="font-bold text-base mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-secondary" /> Can't donate right now?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              You can still support{cause.name ? ` ${cause.name}` : ' this cause'} by making a prediction. If your prediction is correct, we will donate to <strong>{cause.name}</strong> on your behalf.
            </p>
            <Link to={`/predict?cause_id=${cause.id}`}>
              <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold">
                <Trophy className="w-4 h-4" /> Predict & Give
              </Button>
            </Link>
          </Card>
        </div>

        {/* Donations list */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-bold text-base">Donors</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDonorView('recent'); setShowAll(false); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${donorView === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >Recent</button>
              <button
                onClick={() => { setDonorView('top'); setShowAll(false); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${donorView === 'top' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >Top Donors</button>
              <button onClick={() => refetchDonations()}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {displayDonations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No donations yet. Be the first!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {displayDonations.map((d, i) => (
                   <motion.div key={d.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                     <Card className="p-3.5">
                       <div className="flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                             {donorView === 'top' && i < 3 ? ['🥇','🥈','🥉'][i] : (d.donor_name || 'A').charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="text-sm font-semibold">{d.donor_name || 'Anonymous'}</p>
                             <p className="text-xs text-muted-foreground">
                               {d.created_date ? format(new Date(d.created_date), 'MMM d, yyyy') : ''}
                             </p>
                           </div>
                         </div>
                         <span className="font-extrabold text-emerald-600 text-sm shrink-0">₦{(d.amount || 0).toLocaleString()}</span>
                       </div>
                       {d.public_note && (
                         <div className="mt-2 pt-2 border-t border-border flex items-start gap-2">
                           <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                           <p className="text-xs text-muted-foreground italic">"{d.public_note}"</p>
                         </div>
                       )}
                     </Card>
                   </motion.div>
                 ))}
              {sortedDonations.length > 10 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="w-full text-sm text-primary font-semibold py-2 hover:underline"
                >
                  {showAll ? 'Show less' : `See all ${sortedDonations.length} donations`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Impact Card CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 mb-4">
        <Card className="p-5 bg-gradient-to-r from-primary/5 to-secondary/10 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base flex items-center gap-2"><Star className="w-4 h-4 text-secondary" /> Share Your Support</p>
            <p className="text-sm text-muted-foreground">Generate a shareable Impact Card and inspire others to donate.</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setShowImpactCard(true)}>
            <Share2 className="w-4 h-4" /> Create Impact Card
          </Button>
        </Card>
      </div>

      {showImpactCard && cause && (
        <ImpactCard cause={cause} donorName="" amount={0} onClose={() => setShowImpactCard(false)} />
      )}
    </div>
  );
}