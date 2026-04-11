import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, CheckCircle2, Loader2, Mail, Repeat, Info, MapPin, ExternalLink, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ImpactCard from '@/components/ImpactCard';
import { toast } from 'sonner';
import { buildEmailHtml, detailRow } from '@/lib/emailTemplate';
import { Link } from 'react-router-dom';

const PAYSTACK_PUBLIC_KEY = 'pk_test_a7a105e7423c48d648f9ba15d4705ed2a4c470f1';
const presetAmounts = [500, 1000, 2000, 5000, 10000, 25000];
const TIP_PERCENTAGES = [0, 5, 10, 15, 20];

function loadPaystack() {
  return new Promise((resolve) => {
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(window.PaystackPop);
    document.head.appendChild(script);
  });
}

export default function Donate() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCause = urlParams.get('cause_id');

  const [selectedCause, setSelectedCause] = useState(preselectedCause || '');
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [frequency, setFrequency] = useState('one-time');
  // Tip state
  const [tipMode, setTipMode] = useState('percent');
  const [tipPercent, setTipPercent] = useState(10);
  const [customTip, setCustomTip] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [showImpactCard, setShowImpactCard] = useState(false);

  const queryClient = useQueryClient();

  const { data: causes } = useQuery({
    queryKey: ['causes'],
    queryFn: () => base44.entities.Cause.list(),
    initialData: [],
  });

  const donationAmount = Number(amount) || 0;
  const tipAmount = tipMode === 'percent'
    ? Math.round(donationAmount * tipPercent / 100)
    : Math.max(0, Number(customTip) || 0);
  const totalCharged = donationAmount + tipAmount;

  const recordDonation = useMutation({
    mutationFn: async ({ reference }) => {
      const cause = causes.find(c => c.id === selectedCause);
      await base44.entities.Donation.create({
        cause_id: selectedCause,
        cause_name: cause?.name || '',
        amount: donationAmount,
        type: 'direct',
        frequency,
        donor_name: donorName || 'Anonymous',
        donor_email: donorEmail,
        paystack_reference: reference,
        payment_status: 'success',
        public_note: publicNote || undefined,
      });
      if (cause) {
        await base44.entities.Cause.update(cause.id, {
          raised_amount: (cause.raised_amount || 0) + donationAmount,
        });
      }
      // Send receipt email
      if (donorEmail) {
        await base44.integrations.Core.SendEmail({
          to: donorEmail,
          subject: `Qada.Bet — Donation Receipt ₦${donationAmount.toLocaleString()}`,
          body: buildEmailHtml({
            preheader: `Thank you for donating ₦${donationAmount.toLocaleString()} to ${cause?.name}!`,
            body: `
              <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#1a237e;">Thank You, ${donorName || 'Friend'}! 💚</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Your donation has been received and is making a real difference.
              </p>
              <div style="background:linear-gradient(135deg,#1a237e,#283593);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:1px;">Donation Amount</p>
                <p style="margin:0;font-size:36px;font-weight:900;color:#f9a825;">₦${donationAmount.toLocaleString()}</p>
                <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">directed to <strong style="color:#fff;">${cause?.name || 'your chosen cause'}</strong></p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${detailRow('Cause', cause?.name || '—')}
                ${detailRow('Donation', `₦${donationAmount.toLocaleString()}`, true)}
                ${tipAmount > 0 ? detailRow('Platform Tip', `₦${tipAmount.toLocaleString()}`) : ''}
                ${detailRow('Total Charged', `₦${totalCharged.toLocaleString()}`)}
                ${detailRow('Frequency', frequency === 'monthly' ? '🔄 Monthly (recurring)' : 'One-Time')}
                ${detailRow('Reference', reference)}
                ${detailRow('Date', new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }))}
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">
                Your generosity is helping change lives across Nigeria.
                ${frequency === 'monthly' ? 'Your monthly contribution will be automatically renewed each month. You can cancel anytime via Paystack.' : ''}
              </p>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">With deep gratitude,<br/><strong style="color:#1a237e;">The Qada.Bet Team</strong></p>
            `,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['causes'] });
      setSuccess(true);
      setShowImpactCard(true);
    },
    onError: () => {
      toast.error('Donation recorded but email failed. Contact hello@qada.bet');
      setSuccess(true);
    },
  });

  const handlePay = async () => {
    if (!donorEmail) { toast.error('Please enter your email address.'); return; }
    if (!selectedCause) { toast.error('Please select a cause.'); return; }
    if (!amount || donationAmount < 100) { toast.error('Minimum donation is ₦100.'); return; }

    setPaying(true);
    const PaystackPop = await loadPaystack();
    const ref = `qada-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: donorEmail,
      amount: totalCharged * 100, // kobo — includes tip
      currency: 'NGN',
      ref,
      metadata: {
        custom_fields: [
          { display_name: 'Donor Name', variable_name: 'donor_name', value: donorName || 'Anonymous' },
          { display_name: 'Cause', variable_name: 'cause', value: causes.find(c => c.id === selectedCause)?.name || '' },
          { display_name: 'Frequency', variable_name: 'frequency', value: frequency },
          { display_name: 'Platform Tip', variable_name: 'tip', value: `₦${tipAmount.toLocaleString()}` },
        ],
      },
      callback: (response) => {
        setPaying(false);
        recordDonation.mutate({ reference: response.reference });
      },
      onClose: () => {
        setPaying(false);
        toast.info('Payment cancelled.');
      },
    });
    handler.openIframe();
  };

  if (success) {
    const donatedCause = causes.find(c => c.id === selectedCause);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {showImpactCard && donatedCause && (
          <ImpactCard cause={donatedCause} donorName={donorName} amount={donationAmount} onClose={() => setShowImpactCard(false)} />
        )}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-1">Your donation of ₦{donationAmount.toLocaleString()} has been received.</p>
          {tipAmount > 0 && (
            <p className="text-sm text-muted-foreground mb-1">Platform tip: ₦{tipAmount.toLocaleString()} — thank you for keeping Qada.Bet running!</p>
          )}
          <p className="text-sm text-muted-foreground mb-1">
            Directed to: <strong>{causes.find(c => c.id === selectedCause)?.name}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            A receipt has been sent to <strong>{donorEmail}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowImpactCard(true)} className="gap-2"><MessageSquare className="w-4 h-4" /> My Impact Card</Button>
            <Button onClick={() => { setSuccess(false); setAmount(''); setDonorName(''); setDonorEmail(''); setCustomTip(''); setTipPercent(10); setPublicNote(''); }}>Donate Again</Button>
            <Button variant="outline" asChild><a href="/causes">View Causes</a></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-16 sm:py-20 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
              <Heart className="inline w-8 h-8 text-secondary mr-2 mb-1" />
              Donate Directly
            </h1>
            <p className="mt-3 text-muted-foreground">Make a direct impact — no predictions needed. No login required.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-lg mx-auto px-4">
          <Card className="p-6 space-y-5">

            {/* Cause */}
            <div>
              <Label className="mb-2 block">Select a Cause <span className="text-destructive">*</span></Label>
              <Select value={selectedCause} onValueChange={setSelectedCause}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a verified cause" />
                </SelectTrigger>
                <SelectContent>
                  {causes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Cause preview */}
              {selectedCause && (() => {
                const cause = causes.find(c => c.id === selectedCause);
                if (!cause) return null;
                return (
                  <div className="mt-3 rounded-xl border border-border bg-muted/40 overflow-hidden flex gap-3 p-3">
                    {cause.image_url ? (
                      <img src={cause.image_url} alt={cause.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {cause.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{cause.name}</p>
                      {cause.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {cause.location}
                        </p>
                      )}
                      {cause.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cause.description}</p>
                      )}
                      <a href={`/causes/${cause.id}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                        <ExternalLink className="w-3 h-3" /> Read more about this cause
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Email */}
            <div>
              <Label className="mb-2 block">Email Address <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Your donation receipt will be sent here.</p>
            </div>

            {/* Name */}
            <div>
              <Label className="mb-2 block">Your Name (optional)</Label>
              <Input placeholder="Anonymous" value={donorName} onChange={e => setDonorName(e.target.value)} />
            </div>

            {/* Public Note */}
            <div>
              <Label className="mb-2 block flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Leave a public message (optional)</Label>
              <Textarea
                placeholder="e.g. Keep up the amazing work! Inspired by this cause."
                value={publicNote}
                onChange={e => setPublicNote(e.target.value)}
                maxLength={200}
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">This will be visible on the cause page.</p>
            </div>

            {/* Frequency */}
            <div>
              <Label className="mb-2 block">Donation Frequency</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'one-time', label: 'One-Time', icon: Heart },
                  { value: 'monthly', label: 'Monthly', icon: Repeat },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFrequency(value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                      frequency === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              {frequency === 'monthly' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  🔄 Monthly donations are charged automatically each month. Cancel anytime.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <Label className="mb-2 block">Donation Amount (₦) <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetAmounts.map(a => (
                  <Button key={a} variant={Number(amount) === a ? 'default' : 'outline'} size="sm"
                    onClick={() => setAmount(String(a))} className="font-semibold">
                    ₦{a.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input type="number" placeholder="Or enter custom amount" value={amount}
                onChange={e => setAmount(e.target.value)} min="100" />
            </div>

            {/* Platform Tip */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Qada.Bet charges 0% platform fee to beneficiaries.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qada.Bet will continue offering its services thanks to donors who leave an optional tip.
                  </p>
                </div>
              </div>

              {/* Toggle tip mode */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipMode('percent')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    tipMode === 'percent' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
                  }`}
                >
                  % of donation
                </button>
                <button
                  type="button"
                  onClick={() => setTipMode('custom')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    tipMode === 'custom' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
                  }`}
                >
                  Custom amount
                </button>
              </div>

              {tipMode === 'percent' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Tip: {tipPercent}%</span>
                    {donationAmount > 0 && (
                      <span className="text-xs font-bold text-primary">₦{tipAmount.toLocaleString()}</span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={5}
                    value={tipPercent}
                    onChange={e => setTipPercent(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    {TIP_PERCENTAGES.map(p => <span key={p}>{p}%</span>)}
                  </div>
                  {tipPercent === 0 && (
                    <p className="text-xs text-muted-foreground italic">No tip selected — that's okay!</p>
                  )}
                </div>
              ) : (
                <div>
                  <Input
                    type="number"
                    placeholder="Enter tip amount (optional)"
                    value={customTip}
                    onChange={e => setCustomTip(e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank or 0 for no tip.</p>
                </div>
              )}
            </div>

            {/* Summary */}
            {donationAmount >= 100 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Donation to cause</span>
                  <span className="font-semibold">₦{donationAmount.toLocaleString()}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform tip (optional)</span>
                    <span className="font-semibold text-primary">₦{tipAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-border pt-1.5 mt-1.5">
                  <span className="font-bold">Total charged</span>
                  <span className="font-extrabold text-primary">₦{totalCharged.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Donate Now button */}
            <Button
              className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold py-6 text-base"
              disabled={!selectedCause || !donorEmail || !amount || donationAmount < 100 || paying || recordDonation.isPending}
              onClick={handlePay}
            >
              {(paying || recordDonation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-5 h-5" />}
              {paying
                ? 'Opening Paystack...'
                : `Donate Now${donationAmount >= 100 ? ` — ₦${totalCharged.toLocaleString()}` : ''}`
              }
            </Button>

            {/* Legal consent */}
            <p className="text-xs text-center text-muted-foreground">
              By clicking &apos;Donate Now&apos;, you agree to Qada.Bet&apos;s{' '}
              <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>

            <p className="text-xs text-center text-muted-foreground">
              Donation will be processed and secured by Paystack. Qada.Bet guarantees 100% of your donation goes to the selected verified cause.
              {frequency === 'monthly' && ' Recurring monthly — cancel anytime via Paystack.'}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}