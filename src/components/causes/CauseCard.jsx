import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Heart, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryGradients = {
  shelter: 'from-blue-500 to-blue-700',
  education: 'from-indigo-500 to-indigo-700',
  water: 'from-cyan-500 to-cyan-700',
  health: 'from-rose-500 to-rose-700',
  food: 'from-orange-500 to-orange-700',
  environment: 'from-emerald-500 to-emerald-700',
};

export default function CauseCard({ cause }) {
  const percentage = cause.goal_amount ? Math.round((cause.raised_amount / cause.goal_amount) * 100) : 0;
  const gradient = categoryGradients[cause.category] || 'from-blue-500 to-blue-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-shadow"
    >
      {/* Header with gradient or image */}
      <div className={`bg-gradient-to-br ${gradient} p-6 text-white text-center relative overflow-hidden`}>
        {cause.image_url && (
          <img src={cause.image_url} alt={cause.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30 overflow-hidden">
            {cause.image_url
              ? <img src={cause.image_url} alt={cause.name} className="w-full h-full object-cover" />
              : <span className="text-sm font-bold leading-tight">{cause.name?.split(' ').map(w => w[0]).join('')}</span>
            }
          </div>
          <h3 className="font-bold text-lg">{cause.name}</h3>
          {cause.location && (
            <p className="text-sm opacity-80 flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {cause.location}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <Badge variant="outline" className="mb-3 capitalize">{cause.category}</Badge>

        {cause.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cause.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-semibold">₦{(cause.raised_amount || 0).toLocaleString()} / ₦{(cause.goal_amount || 0).toLocaleString()}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right font-semibold">{percentage}% of goal</p>
        </div>

        <div className="flex gap-2 mt-5">
          <Link to={`/donate?cause_id=${cause.id}`} className="flex-1">
            <Button variant="default" className="w-full gap-1 font-semibold" size="sm">
              Donate Now
            </Button>
          </Link>
          <Link to={`/predict?cause_id=${cause.id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-1 border-secondary text-secondary-foreground bg-secondary/10 hover:bg-secondary/20 font-semibold" size="sm">
              <Heart className="w-3 h-3" /> Predict & Give
            </Button>
          </Link>
        </div>
        <Link to={`/causes/${cause.id}`} className="block mt-2 text-center text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" /> Read more
        </Link>
      </div>
    </motion.div>
  );
}