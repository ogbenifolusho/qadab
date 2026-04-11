import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Trophy, Heart, ArrowRight, CheckCircle2, Loader2, Lock, AlertCircle } from 'lucide-react';
import { buildEmailHtml, detailRow } from '@/lib/emailTemplate';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EventCountdown from '@/components/EventCountdown';

export default function Predict() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCause = urlParams.get('cause_id');

  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [selectedCause, setSelectedCause] = useState(preselectedCause || '');
  const [step, setStep] = useState(1);

  const [isCauseManager, setIsCauseManager] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      setIsAuth(auth);
      if (auth) {
        const u = await base44.auth.me();
        setUser(u);
        // Check if user manages a cause
        const myCauses = await base44.entities.Cause.filter({ created_by: u.email });
        setIsCauseManager(myCauses.length > 0);
      }
    });
  }, []);

  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }),
    initialData: [],
  });

  const { data: causes } = useQuery({
    queryKey: ['causes'],
    queryFn: () => base44.entities.Cause.list(),
    initialData: [],
  });

  // Load user's existing predictions to prevent duplicates
  const { data: myPredictions } = useQuery({
    queryKey: ['my-predictions-ids'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Prediction.filter({ created_by: user.email });
    },
    enabled: !!user,
    initialData: [],
  });

  const alreadyPredictedEventIds = new Set(myPredictions.map(p => p.event_id));

  const submitPrediction = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Prediction.create(data);
      // Send confirmation email
      if (user?.email) {
        const cause = causes.find(c => c.id === data.cause_id);
        const outcomeLabel = selectedEvent?.options?.find(o => o.value === data.selected_outcome)?.label || data.selected_outcome;
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Qada.Bet — Prediction Confirmed: ${data.event_title}`,
          body: buildEmailHtml({
            preheader: `Your prediction on "${data.event_title}" has been recorded!`,
            body: `
              <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#1a237e;">Prediction Confirmed! 🎯</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Hi <strong>${user.full_name || 'Predictor'}</strong>, your prediction is locked in. Good luck!
              </p>

              <!-- Pick highlight -->
              <div style="background:linear-gradient(135deg,#1a237e,#283593);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Pick</p>
                <p style="margin:0;font-size:28px;font-weight:900;color:#f9a825;">${outcomeLabel}</p>
                <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">on <strong style="color:#fff;">${data.event_title}</strong></p>
              </div>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${detailRow('Event', data.event_title)}
                ${detailRow('Your Pick', outcomeLabel)}
                ${detailRow('Cause Supported', cause?.name || data.cause_name)}
                ${detailRow('Pledge if Correct', `₦${Number(data.pledge_amount).toLocaleString()}`, true)}
                ${detailRow('Submitted', new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }))}
              </table>

              <!-- Info box -->
              <div style="background:#fff8e1;border-left:4px solid #f9a825;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#795548;line-height:1.6;">
                  ✅ <strong>If correct</strong> — ₦${Number(data.pledge_amount).toLocaleString()} is donated to ${cause?.name || data.cause_name}.<br/>
                  ❌ <strong>If wrong</strong> — nothing is charged. Zero risk to you.
                </p>
              </div>

              <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">With gratitude,<br/><strong style="color:#1a237e;">The Qada.Bet Team</strong></p>
            `,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions-ids'] });
      toast.success('Prediction submitted! Confirmation email sent.');
      setStep(5);
    },
  });

  const handleSubmit = () => {
    const cause = causes.find(c => c.id === selectedCause);
    const pledgeAmount = selectedEvent?.pledge_amount || 100;
    submitPrediction.mutate({
      event_id: selectedEvent.id,
      event_title: selectedEvent.title,
      cause_id: selectedCause,
      cause_name: cause?.name || '',
      selected_outcome: selectedOutcome,
      pledge_amount: pledgeAmount,
    });
  };

  // Not logged in
  if (isAuth === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Login Required</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to make predictions and support causes.</p>
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold"
            onClick={() => base44.auth.redirectToLogin(window.location.href)}>
            Login / Register to Predict
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Want to donate without logging in?{' '}
            <a href="/donate" className="text-primary font-semibold underline">Donate directly</a>
          </p>
        </motion.div>
      </div>
    );
  }

  if (isAuth === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isCauseManager) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Cause Managers Can't Predict</h2>
          <p className="text-muted-foreground mb-6">Your account is registered as a cause manager. You can manage your cause and receive donations, but cannot make predictions.</p>
          <a href="/beneficiary">
            <Button className="w-full bg-primary hover:bg-primary/90 font-bold">Go to Beneficiary Dashboard</Button>
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="py-16 sm:py-20 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
              Predict & <span className="text-secondary">Give</span>
            </h1>
            <p className="mt-3 text-muted-foreground">Predict the outcome, support a cause, make an impact.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-8 sm:w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Choose Event */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6">Choose an Event</h2>
                {events.length === 0 ? (
                  <Card className="p-10 text-center text-muted-foreground">
                    <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events right now. Check back soon!</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {events.map(event => {
                      const alreadyDone = alreadyPredictedEventIds.has(event.id);
                      return (
                        <Card
                          key={event.id}
                          className={`p-4 transition-all ${alreadyDone ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} ${
                            selectedEvent?.id === event.id ? 'ring-2 ring-primary shadow-md' : ''
                          }`}
                          onClick={() => { if (!alreadyDone) { setSelectedEvent(event); setSelectedOutcome(''); } }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                              <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base">{event.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="secondary" className="capitalize text-xs">{event.category}</Badge>
                                {event.event_date && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-primary">
                                  Pledge: ₦{(event.pledge_amount || 100).toLocaleString()}
                                </span>
                              </div>
                              {event.event_date && (
                                <div className="mt-1.5">
                                  <EventCountdown eventDate={event.event_date} />
                                </div>
                              )}
                            </div>
                            {alreadyDone && (
                              <Badge className="bg-emerald-100 text-emerald-700 shrink-0 gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Predicted
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {selectedEvent && (
                  <Button className="w-full mt-6 gap-2 font-semibold" onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            )}

            {/* Step 2: Pick Outcome */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-2">Make Your Pick</h2>
                <p className="text-sm text-muted-foreground mb-6">Predict the outcome for: <strong>{selectedEvent?.title}</strong></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEvent?.options?.map(option => (
                    <Card
                      key={option.value}
                      className={`p-5 cursor-pointer text-center transition-all hover:shadow-md ${
                        selectedOutcome === option.value ? 'ring-2 ring-primary bg-primary/5 shadow-md' : ''
                      }`}
                      onClick={() => setSelectedOutcome(option.value)}
                    >
                      <p className="font-semibold">{option.label}</p>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button className="flex-1 gap-2 font-semibold" onClick={() => setStep(3)} disabled={!selectedOutcome}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Cause */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-2">Select a Cause</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  If your prediction is correct, <strong className="text-primary">₦{(selectedEvent?.pledge_amount || 100).toLocaleString()}</strong> will be donated to your chosen cause.
                </p>
                <div className="space-y-3">
                  {causes.map(c => (
                    <Card
                      key={c.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedCause === c.id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedCause(c.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{c.category} · {c.location}</p>
                        </div>
                        {selectedCause === c.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button className="flex-1 gap-2 font-semibold" onClick={() => setStep(4)} disabled={!selectedCause}>
                    Review <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6">Review Your Prediction</h2>
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-semibold text-right max-w-[60%]">{selectedEvent?.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Pick</span>
                    <span className="font-semibold">{selectedEvent?.options?.find(o => o.value === selectedOutcome)?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cause</span>
                    <span className="font-semibold">{causes.find(c => c.id === selectedCause)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pledge (if correct)</span>
                    <span className="font-bold text-lg text-primary">₦{(selectedEvent?.pledge_amount || 100).toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t text-xs text-muted-foreground text-center bg-muted/40 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 inline mr-1 text-amber-500" />
                    If correct → ₦{(selectedEvent?.pledge_amount || 100).toLocaleString()} is donated. If wrong → nothing is taken.
                  </div>
                </Card>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button
                    className="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold"
                    onClick={handleSubmit}
                    disabled={submitPrediction.isPending}
                  >
                    {submitPrediction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                    Submit Prediction
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">Prediction Submitted!</h2>
                <p className="text-muted-foreground mb-8">Your impact is on the way. Good luck!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => { setStep(1); setSelectedEvent(null); setSelectedOutcome(''); setSelectedCause(preselectedCause || ''); }}>
                    Make Another Prediction
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/predictions">View My Predictions</a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}