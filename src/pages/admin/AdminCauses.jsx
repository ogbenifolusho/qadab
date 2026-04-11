import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Heart, CheckCircle2, X, Loader2, ShieldCheck, ShieldX, Pin, PinOff, Eye, Mail } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { toast } from 'sonner';

const CATEGORIES = ['shelter', 'education', 'water', 'health', 'food', 'environment'];
const EMPTY = { name: '', location: '', category: 'education', description: '', purpose: '', contact_person: '', contact_phone: '', contact_email: '', website_url: '', goal_amount: '', image_url: '', is_verified: true, status: 'pending', is_pinned: false, bank_name: '', bank_account_name: '', bank_account_number: '', bank_sort_code: '', cac_documents: '', supporting_documents: '', contact_id_document: '', contact_passport_photo: '' };

export default function AdminCauses() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);
  const [statusAction, setStatusAction] = useState(null); // { cause, newStatus }
  const [queryMsg, setQueryMsg] = useState('');
  const [viewCause, setViewCause] = useState(null);

  const { data: causes = [], isLoading } = useQuery({
    queryKey: ['admin-causes'],
    queryFn: () => base44.entities.Cause.list('-created_date'),
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Cause.update(editing.id, data)
      : base44.entities.Cause.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-causes'] }); closeForm(); },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.Cause.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-causes'] }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ cause, newStatus, queryMsg }) => {
      await base44.entities.Cause.update(cause.id, { status: newStatus });
      
      if (!cause.contact_email) return;
      
      let subject = '';
      let body = '';
      
      if (newStatus === 'approved') {
        subject = `Your Cause "${cause.name}" has been Approved!`;
        body = `Hello ${cause.contact_person || ''},\n\nGreat news! Your cause registration for "${cause.name}" has been approved. It is now live on the Qada.Bet platform and ready to receive donations from our users.\n\nThank you for partnering with us to make a difference.\n\nBest,\nQada.Bet Team`;
      } else if (newStatus === 'rejected') {
        subject = `Update on your Cause Registration: "${cause.name}"`;
        body = `Hello ${cause.contact_person || ''},\n\nThank you for applying to register "${cause.name}" on Qada.Bet.\n\nAfter careful review, we regret to inform you that we cannot approve your cause at this time.\n\nIf you have any questions, please reply to this email.\n\nRegards,\nQada.Bet Team`;
      } else if (newStatus === 'queried') {
        subject = `Action Required: Query regarding "${cause.name}"`;
        body = `Hello ${cause.contact_person || ''},\n\nWe are currently reviewing your registration for "${cause.name}".\n\nWe need some clarifications or additional supporting documents before we can proceed:\n\n${queryMsg || 'Please provide more details about your cause.'}\n\nPlease reply to this email with the requested information.\n\nRegards,\nQada.Bet Team`;
      }
      
      if (subject) {
        try {
          await base44.integrations.Core.SendEmail({ to: cause.contact_email, subject, body });
        } catch (e) {
          console.error("Failed to send status email", e);
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-causes'] }); toast.success('Status updated'); },
  });

  const togglePin = useMutation({
    mutationFn: ({ id, val }) => base44.entities.Cause.update(id, { is_pinned: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-causes'] }),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '', location: c.location || '', category: c.category || 'education',
      description: c.description || '', purpose: c.purpose || '',
      contact_person: c.contact_person || '', contact_phone: c.contact_phone || '',
      contact_email: c.contact_email || '', website_url: c.website_url || '',
      goal_amount: c.goal_amount || '', image_url: c.image_url || '',
      is_verified: c.is_verified !== false,
      bank_name: c.bank_name || '', bank_account_name: c.bank_account_name || '',
      bank_account_number: c.bank_account_number || '', bank_sort_code: c.bank_sort_code || '',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    save.mutate({ ...form, goal_amount: Number(form.goal_amount) || 0, raised_amount: editing?.raised_amount || 0 });
  };

  const filtered = causes.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    const causeStatus = c.status || (c.is_verified ? 'approved' : 'pending');
    const matchFilter = filter === 'all' || causeStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirm}
        title="Delete Cause?"
        message={`Permanently delete "${confirm?.cause?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          remove.mutate(confirm.cause.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Beneficiaries</h1>
          <p className="text-slate-500 text-sm">Manage and verify charitable causes</p>
        </div>
        <Button onClick={openNew} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold gap-2">
          <Plus className="w-4 h-4" /> Add Cause
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search causes..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 max-w-xs" />
        {['all', 'pending', 'approved', 'queried', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>{f}</button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-bold text-white">{editing ? 'Edit Cause' : 'New Cause'}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" placeholder="Cause name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Lagos, Nigeria" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Goal Amount (₦)</Label>
                  <Input type="number" value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="1000000" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Verification</Label>
                  <Select value={form.is_verified ? 'verified' : 'pending'} onValueChange={v => setForm(f => ({ ...f, is_verified: v === 'verified' }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="verified" className="text-emerald-400">✓ Verified</SelectItem>
                      <SelectItem value="pending" className="text-amber-400">⏳ Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Purpose of Donation</Label>
                <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="What funds will be used for..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Contact Person</Label>
                  <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Full name" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Contact Phone</Label>
                  <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="+234..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Contact Email</Label>
                  <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="contact@..." />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Website / Social URL</Label>
                  <Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Image URL</Label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
              </div>

              {/* Bank Account Details */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">🏦 Bank Account Details (for payouts)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs mb-1 block">Bank Name</Label>
                    <Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. GTBank" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs mb-1 block">Account Number</Label>
                    <Input value={form.bank_account_number} onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="0123456789" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-slate-300 text-xs mb-1 block">Account Name</Label>
                    <Input value={form.bank_account_name} onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="Registered name" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs mb-1 block">Sort Code (optional)</Label>
                    <Input value={form.bank_sort_code} onChange={e => setForm(f => ({ ...f, bank_sort_code: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="000000" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={save.isPending}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold gap-2">
                  {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Cause'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm} className="text-slate-400">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewCause && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="font-bold text-white">{viewCause.name}</h2>
              <button onClick={() => setViewCause(null)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Category</p>
                  <p className="text-white capitalize">{viewCause.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Status</p>
                  <p className="text-white capitalize">{viewCause.status || 'pending'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Location</p>
                  <p className="text-white">{viewCause.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Goal Amount</p>
                  <p className="text-emerald-400 font-bold">₦{(viewCause.goal_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Description & Purpose */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Description</p>
                <p className="text-slate-300 text-sm">{viewCause.description}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Purpose</p>
                <p className="text-slate-300 text-sm">{viewCause.purpose}</p>
              </div>

              {/* Contact Info */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-3">📋 Contact Person</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-white">{viewCause.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-blue-400">{viewCause.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-white">{viewCause.contact_phone}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-3">🏦 Bank Account</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Bank</p>
                    <p className="text-white">{viewCause.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account Name</p>
                    <p className="text-white">{viewCause.bank_account_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account Number</p>
                    <p className="text-white font-mono">{viewCause.bank_account_number}</p>
                  </div>
                </div>
              </div>

              {/* Documents Links */}
              {(viewCause.cac_documents || viewCause.supporting_documents || viewCause.contact_id_document || viewCause.contact_passport_photo) && (
                <div className="border-t border-slate-800 pt-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-3">📄 Documents</p>
                  <div className="space-y-2">
                    {viewCause.cac_documents && (
                      <a href={viewCause.cac_documents} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">📋 CAC Certificate</a>
                    )}
                    {viewCause.supporting_documents && (
                      <a href={viewCause.supporting_documents} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline block">📋 Supporting Documents</a>
                    )}
                    {viewCause.contact_id_document && (
                      <a href={viewCause.contact_id_document} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline block">🆔 ID Document</a>
                    )}
                    {viewCause.contact_passport_photo && (
                      <a href={viewCause.contact_passport_photo} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline block">📸 Passport Photo</a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-800">
                <Button onClick={() => setViewCause(null)} variant="ghost" className="flex-1 text-slate-400">Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Action Modal */}
      {statusAction && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-bold text-white">
                {statusAction.newStatus === 'approved' ? 'Approve Cause' : 
                 statusAction.newStatus === 'queried' ? 'Query Cause' : 'Reject Cause'}
              </h2>
              <button onClick={() => setStatusAction(null)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300">{statusAction.cause.name}</p>
              {statusAction.newStatus === 'queried' && (
                <div>
                  <Label className="text-slate-300 text-xs mb-2 block">Query Message</Label>
                  <Textarea value={queryMsg} onChange={e => setQueryMsg(e.target.value)}
                    placeholder="Request more info/documents from the applicant..."
                    className="bg-slate-800 border-slate-700 text-white text-sm h-24" />
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStatusAction(null)} className="flex-1 text-slate-400">Cancel</Button>
                <Button onClick={() => {
                  toggleStatus.mutate({ cause: statusAction.cause, newStatus: statusAction.newStatus, queryMsg });
                  setStatusAction(null);
                  setQueryMsg('');
                }} disabled={toggleStatus.isPending}
                  className={`flex-1 gap-2 ${
                    statusAction.newStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    statusAction.newStatus === 'queried' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}>
                  {toggleStatus.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {statusAction.newStatus === 'approved' ? 'Approve' : 
                   statusAction.newStatus === 'queried' ? 'Send Query' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><Heart className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No causes found.</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden md:table-cell">Goal</th>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Status</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.location}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 capitalize hidden sm:table-cell">{c.category}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-400 hidden md:table-cell">₦{(c.goal_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-md border font-semibold ${
                      (c.status === 'approved' || (c.status === undefined && c.is_verified))
                        ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                        : c.status === 'queried'
                        ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                        : c.status === 'rejected'
                        ? 'bg-red-400/10 text-red-400 border-red-400/20'
                        : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    }`}>
                      {c.status === 'approved' || (c.status === undefined && c.is_verified) ? '✓ Approved' : c.status === 'queried' ? '❓ Queried' : c.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setStatusAction({ cause: c, newStatus: 'approved' })}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-emerald-400" title="Approve">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setStatusAction({ cause: c, newStatus: 'queried' })}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-blue-400" title="Query">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setStatusAction({ cause: c, newStatus: 'rejected' })}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400" title="Reject">
                        <ShieldX className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => togglePin.mutate({ id: c.id, val: !c.is_pinned })}
                        className={`p-1.5 hover:bg-slate-700 rounded-lg transition-colors ${c.is_pinned ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                        title={c.is_pinned ? 'Unpin' : 'Pin'}>
                        {c.is_pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setViewCause(c)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirm({ type: 'delete', cause: c })} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}