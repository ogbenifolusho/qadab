import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Clock, CheckCircle2, XCircle, Heart, Search, Loader2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const predictionStatus = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  correct: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Correct' },
  incorrect: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Incorrect' },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
};

export default function History() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Real-time: refresh predictions when graded
  useEffect(() => {
    const unsub = base44.entities.Prediction.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['my-predictions-history'] });
    });
    const unsubE = base44.entities.Event.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['events-for-history'] });
    });
    return () => { unsub(); unsubE(); };
  }, []);

  const { data: predictions, isLoading: loadingPreds } = useQuery({
    queryKey: ['my-predictions-history', user?.email],
    queryFn: () => base44.entities.Prediction.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: donations, isLoading: loadingDons } = useQuery({
    queryKey: ['my-donations-history', user?.email],
    queryFn: () => base44.entities.Donation.filter({ donor_email: user.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  // Fetch all events to get live status sync
  const { data: events = [] } = useQuery({
    queryKey: ['events-for-history'],
    queryFn: () => base44.entities.Event.list(),
    enabled: !!user,
  });

  const eventMap = events.reduce((acc, e) => { acc[e.id] = e; return acc; }, {});

  // Merge event status into predictions
  const enrichedPredictions = predictions.map(p => {
    const event = eventMap[p.event_id];
    if (!event) return p;
    // If event is live or upcoming, prediction shows pending
    // If event is completed/cancelled and prediction is still pending, show event status context
    return {
      ...p,
      event_status: event.status,
    };
  });

  const isLoading = loadingPreds || loadingDons || !user;

  // Combine into unified list
  const combined = [
    ...enrichedPredictions.map(p => ({ ...p, _type: 'prediction' })),
    ...donations.map(d => ({ ...d, _type: 'donation' })),
  ];

  // Filter
  const filtered = combined.filter(item => {
    const matchType = typeFilter === 'all' || item._type === typeFilter;
    const matchStatus = statusFilter === 'all'
      || (item._type === 'prediction' && item.status === statusFilter)
      || (item._type === 'donation' && item.payment_status === statusFilter);
    const title = item._type === 'prediction'
      ? `${item.event_title} ${item.cause_name} ${item.selected_outcome}`
      : `${item.cause_name} ${item.donor_name}`;
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aDate = new Date(a.created_date || 0);
    const bDate = new Date(b.created_date || 0);
    if (sortBy === 'newest') return bDate - aDate;
    if (sortBy === 'oldest') return aDate - bDate;
    const aAmt = a._type === 'prediction' ? (a.pledge_amount || 0) : (a.amount || 0);
    const bAmt = b._type === 'prediction' ? (b.pledge_amount || 0) : (b.amount || 0);
    if (sortBy === 'amount_desc') return bAmt - aAmt;
    if (sortBy === 'amount_asc') return aAmt - bAmt;
    return 0;
  });

  return (
    <div>
      <section className="py-16 sm:py-20 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">My History</h1>
            <p className="mt-3 text-muted-foreground">All your predictions and donations in one place.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 sm:py-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search events, causes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="prediction">Predictions</SelectItem>
                <SelectItem value="donation">Donations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="correct">Correct</SelectItem>
                <SelectItem value="incorrect">Incorrect</SelectItem>
                <SelectItem value="success">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount_desc">Highest Amount</SelectItem>
                <SelectItem value="amount_asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : sorted.length === 0 ? (
            <Card className="p-10 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-4">No activity found.</p>
              <div className="flex gap-3 justify-center">
                <Link to="/predict"><Button size="sm" className="gap-2"><Trophy className="w-4 h-4" /> Predict</Button></Link>
                <Link to="/donate"><Button size="sm" variant="outline" className="gap-2"><Heart className="w-4 h-4" /> Donate</Button></Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-1">{sorted.length} item{sorted.length !== 1 ? 's' : ''}</p>
              {sorted.map((item, i) => (
                <motion.div key={`${item._type}-${item.id}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  {item._type === 'prediction' ? (
                    <PredictionRow p={item} />
                  ) : (
                    <DonationRow d={item} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const EVENT_STATUS_BADGE = {
  live: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-gray-100 text-gray-500',
  upcoming: 'bg-blue-100 text-blue-700',
};

const OUTCOME_LABELS = { home_win: 'Home Win', draw: 'Draw', away_win: 'Away Win' };

function PredictionRow({ p }) {
  const status = predictionStatus[p.status] || predictionStatus.pending;
  const StatusIcon = status.icon;
  const displayOutcome = OUTCOME_LABELS[p.selected_outcome] || p.selected_outcome;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{p.event_title || 'Event'}</h3>
            <Badge variant="outline" className="text-xs">Prediction</Badge>
            {p.event_status && p.event_status !== 'upcoming' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${EVENT_STATUS_BADGE[p.event_status] || ''}`}>
                {p.event_status === 'live' ? '🔴 LIVE' : p.event_status}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick: <strong>{displayOutcome}</strong> · Cause: <strong>{p.cause_name}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-bold text-sm">₦{(p.pledge_amount || 0).toLocaleString()}</span>
          <Badge className={`${status.color} text-xs gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
          {p.status === 'correct' && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{p.points_earned ?? 10} pts
            </span>
          )}
          {p.status === 'incorrect' && (
            <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              0 pts
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function DonationRow({ d }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{d.cause_name || 'Cause'}</h3>
            <Badge variant="outline" className="text-xs">Donation</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct donation
            {d.paystack_reference && <> · Ref: <strong>{d.paystack_reference}</strong></>}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {d.created_date ? format(new Date(d.created_date), 'MMM d, yyyy') : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-bold text-sm">₦{(d.amount || 0).toLocaleString()}</span>
          <Badge className={d.payment_status === 'success' ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
            {d.payment_status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {d.payment_status || 'pending'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}