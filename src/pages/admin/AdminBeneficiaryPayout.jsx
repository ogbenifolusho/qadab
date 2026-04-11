import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Send, Eye, X, Loader2, CheckCircle2, Clock, AlertCircle, Search, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-amber-400/10 text-amber-400 border-amber-400/20', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',   icon: Loader2 },
  paid:       { label: 'Paid',       color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', icon: CheckCircle2 },
  failed:     { label: 'Failed',     color: 'bg-red-400/10 text-red-400 border-red-400/20',       icon: AlertCircle },
};

export default function AdminBeneficiaryPayout() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null);     // payout record being viewed
  const [initiating, setInitiating] = useState(null); // cause for new payout
  const [payoutForm, setPayoutForm] = useState({ period_from: '', period_to: '', note: '' });
  const [confirm, setConfirm] = useState(null);

  const { data: causes = [] } = useQuery({ queryKey: ['payout-causes'], queryFn: () => base44.entities.Cause.list() });
  const { data: donations = [] } = useQuery({ queryKey: ['payout-donations'], queryFn: () => base44.entities.Donation.list() });
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => base44.entities.Payout.list('-created_date'),
  });

  const causeMap = useMemo(() => {
    const m = {};
    causes.forEach(c => { m[c.id] = c; });
    return m;
  }, [causes]);

  // Per-cause summary
  const causeSummaries = useMemo(() => {
    const map = {};
    causes.forEach(c => { map[c.id] = { cause: c, total: 0, count: 0 }; });
    donations.filter(d => d.payment_status === 'success').forEach(d => {
      if (map[d.cause_id]) {
        map[d.cause_id].total += d.amount || 0;
        map[d.cause_id].count++;
      }
    });
    return Object.values(map).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  }, [causes, donations]);

  const totalAllCauses = causeSummaries.reduce((s, c) => s + c.total, 0);
  const totalFees = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0) * 0.05 / 0.95, 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  // 5% fee constant
  const PLATFORM_FEE = 0.05;

  const createPayout = useMutation({
    mutationFn: async ({ cause, form }) => {
      // Calc donations in period
      const from = form.period_from ? new Date(form.period_from) : null;
      const to = form.period_to ? new Date(form.period_to) : null;
      const relevantDonations = donations.filter(d =>
        d.payment_status === 'success' &&
        d.cause_id === cause.id &&
        (!from || new Date(d.created_date) >= from) &&
        (!to || new Date(d.created_date) <= to)
      );
      const grossAmount = relevantDonations.reduce((s, d) => s + (d.amount || 0), 0);
      const amount = grossAmount * (1 - PLATFORM_FEE); // deduct 5%
      await base44.entities.Payout.create({
        cause_id: cause.id,
        cause_name: cause.name,
        amount,
        donation_count: relevantDonations.length,
        period_from: form.period_from || undefined,
        period_to: form.period_to || undefined,
        note: form.note || undefined,
        bank_name: cause.bank_name || '',
        bank_account_name: cause.bank_account_name || '',
        bank_account_number: cause.bank_account_number || '',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] });
      setInitiating(null);
      setPayoutForm({ period_from: '', period_to: '', note: '' });
      toast.success('Payout record created!');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, payout }) => {
      await base44.entities.Payout.update(id, { status });
      
      // Email cause owner when payout is initiated/processing
      if (status === 'processing' && payout.status === 'pending') {
        const cause = causes.find(c => c.id === payout.cause_id);
        if (cause && cause.contact_email) {
          try {
            await base44.integrations.Core.SendEmail({
              to: cause.contact_email,
              subject: `Your payout of ₦${(payout.amount || 0).toLocaleString()} is being processed!`,
              body: `Hello ${cause.contact_person || 'Cause Manager'},\n\nGood news! A payout of ₦${(payout.amount || 0).toLocaleString()} is currently being processed for your cause "${cause.name}".\n\nIt will be transferred to your bank account ending in ${cause.bank_account_number?.slice(-4) || '****'} shortly.\n\nThank you for making a difference,\nQada.Bet Team`
            });
          } catch (e) {
            console.error("Failed to send payout initiated email to cause", e);
          }
        }
      }
      
      // Email donors when payout is paid
      if (status === 'paid' && payout.status !== 'paid') {
        const cause = causes.find(c => c.id === payout.cause_id);
        const fromDate = payout.period_from ? new Date(payout.period_from) : null;
        const toDate = payout.period_to ? new Date(payout.period_to) : null;
        
        // Find relevant donors in this period
        const relevantDonations = donations.filter(d => 
          d.payment_status === 'success' && 
          d.cause_id === payout.cause_id &&
          d.donor_email &&
          (!fromDate || new Date(d.created_date) >= fromDate) &&
          (!toDate || new Date(d.created_date) <= toDate)
        );
        
        // Get unique donor emails
        const uniqueEmails = [...new Set(relevantDonations.map(d => d.donor_email))];
        
        for (const email of uniqueEmails) {
          try {
            await base44.integrations.Core.SendEmail({
              to: email,
              subject: `Your donation impact: Funds delivered to ${payout.cause_name}!`,
              body: `Hello,\n\nWe wanted to let you know that a total payout of ₦${(payout.amount || 0).toLocaleString()} has successfully been delivered to "${payout.cause_name}".\n\nYour contribution was part of this payout, and it's already making a difference.\n\nThank you for your generosity,\nQada.Bet Team`
            });
          } catch (e) {
            console.error("Failed to send payout success email to donor", e);
          }
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payouts'] }); toast.success('Status updated'); },
  });

  const filtered = payouts.filter(p => {
    const matchSearch = (p.cause_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!confirm}
        title="Update Payout Status?"
        message={`Change status to "${confirm?.status}" for payout to ${confirm?.payout?.cause_name}?`}
        confirmLabel="Confirm"
        variant="warning"
        onConfirm={() => { updateStatus.mutate({ id: confirm.payout.id, status: confirm.status, payout: confirm.payout }); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />

      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-yellow-400" /> Beneficiary Payouts
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage and process donation payouts to verified causes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `₦${totalAllCauses.toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Total Paid Out (95%)', value: `₦${totalPaid.toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Platform Fees (5%)', value: `₦${Math.round(totalFees).toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Causes', value: causeSummaries.length, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-cause summary */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Cause Balances</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Cause</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden sm:table-cell">Bank Details</th>
                <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Gross</th>
                <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 hidden lg:table-cell">Payout (95%)</th>
              </tr>
            </thead>
            <tbody>
              {causeSummaries.map(({ cause, total, count }) => (
                <tr key={cause.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{cause.name}</p>
                    <p className="text-xs text-slate-500">{cause.location}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {cause.bank_account_number ? (
                      <div>
                        <p className="text-xs text-slate-300">{cause.bank_name}</p>
                        <p className="text-xs text-slate-500">{cause.bank_account_number} · {cause.bank_account_name}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">⚠ No bank details</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-400">₦{total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-400 hidden lg:table-cell">₦{Math.round(total * 0.95).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-400">{count}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold"
                      onClick={() => { setInitiating(cause); setPayoutForm({ period_from: '', period_to: '', note: '' }); }}
                    >
                      <Send className="w-3 h-3" /> Initiate
                    </Button>
                  </td>
                </tr>
              ))}
              {causeSummaries.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-10">No donation data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Payout Modal */}
      {initiating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-bold text-white">Initiate Payout — {initiating.name}</h2>
              <button onClick={() => setInitiating(null)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Bank details */}
              <div className="bg-slate-800 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Bank Details</p>
                {initiating.bank_account_number ? (
                  <>
                    <p className="text-sm text-slate-200">{initiating.bank_name}</p>
                    <p className="text-sm text-slate-300">{initiating.bank_account_number}</p>
                    <p className="text-xs text-slate-400">{initiating.bank_account_name}</p>
                  </>
                ) : (
                  <p className="text-xs text-red-400">⚠ No bank details on file. Add them in Beneficiaries first.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Period From</Label>
                  <Input type="date" value={payoutForm.period_from}
                    onChange={e => setPayoutForm(f => ({ ...f, period_from: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Period To</Label>
                  <Input type="date" value={payoutForm.period_to}
                    onChange={e => setPayoutForm(f => ({ ...f, period_to: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Note (optional)</Label>
                <Input value={payoutForm.note} onChange={e => setPayoutForm(f => ({ ...f, note: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Q1 2026 payout" />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold gap-2"
                  disabled={createPayout.isPending}
                  onClick={() => createPayout.mutate({ cause: initiating, form: payoutForm })}
                >
                  {createPayout.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" /> Create Payout Record
                </Button>
                <Button variant="ghost" onClick={() => setInitiating(null)} className="text-slate-400">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout History */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Payout History</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 h-8 text-sm w-40" />
            </div>
            {['all', 'pending', 'processing', 'paid', 'failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-10">No payout records found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Cause</th>
                  <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden md:table-cell">Period</th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3">Amount</th>
                  <th className="text-center text-xs text-slate-500 font-semibold px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={p.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-white">{p.cause_name}</p>
                        <p className="text-xs text-slate-500">{p.donation_count} donations</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                        {p.period_from && p.period_to
                          ? `${format(new Date(p.period_from), 'MMM d')} – ${format(new Date(p.period_to), 'MMM d, yyyy')}`
                          : p.period_from ? `From ${format(new Date(p.period_from), 'MMM d, yyyy')}` : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-400">₦{(p.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border font-semibold ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setDetail(p)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Select value={p.status} onValueChange={val =>
                            setConfirm({ payout: p, status: val })
                          }>
                            <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-300 w-28 px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                <SelectItem key={val} value={val} className="text-slate-200 text-xs capitalize">{cfg.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-bold text-white">Payout Details</h2>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {[
                ['Cause', detail.cause_name],
                ['Amount', `₦${(detail.amount || 0).toLocaleString()}`],
                ['Donations', detail.donation_count],
                ['Status', detail.status?.toUpperCase()],
                ['Bank', detail.bank_name || '—'],
                ['Account', detail.bank_account_number || '—'],
                ['Account Name', detail.bank_account_name || '—'],
                ['Period From', detail.period_from ? format(new Date(detail.period_from), 'MMM d, yyyy') : '—'],
                ['Period To', detail.period_to ? format(new Date(detail.period_to), 'MMM d, yyyy') : '—'],
                ['Note', detail.note || '—'],
                ['Created', detail.created_date ? format(new Date(detail.created_date), 'MMM d, yyyy HH:mm') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-800 pb-2 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-semibold text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}