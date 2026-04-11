import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Trophy, X, Loader2, Users, TrendingUp, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { gradeEvent } from '@/lib/eventGrading';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const FOOTBALL_OPTIONS = [
  { label: 'Home Win', value: 'home_win' },
  { label: 'Draw', value: 'draw' },
  { label: 'Away Win', value: 'away_win' },
];

const STATUS_COLORS = {
  upcoming: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  live: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  completed: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const EMPTY = {
  title: '', home_team: '', away_team: '', description: '',
  event_date: '', status: 'upcoming', correct_outcome: '',
  image_url: '', pledge_amount: 100,
};

export default function AdminEvents() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Confirmation dialog state
  const [confirm, setConfirm] = useState(null); // { type: 'delete'|'status', event, newStatus? }
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => base44.entities.Event.list('-created_date'),
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['admin-all-predictions'],
    queryFn: () => base44.entities.Prediction.list(),
  });

  // Count predictions per event
  const predCountByEvent = predictions.reduce((acc, p) => {
    acc[p.event_id] = (acc[p.event_id] || 0) + 1;
    return acc;
  }, {});

  // Sum pledges per event
  const pledgeSumByEvent = predictions.reduce((acc, p) => {
    acc[p.event_id] = (acc[p.event_id] || 0) + (p.pledge_amount || 0);
    return acc;
  }, {});

  const save = useMutation({
    mutationFn: async (data) => {
      const prevEvent = editing;
      const result = editing
        ? await base44.entities.Event.update(editing.id, data)
        : await base44.entities.Event.create(data);

      // Grade if status changed to completed/cancelled
      if (editing && prevEvent.status !== data.status &&
        (data.status === 'completed' || data.status === 'cancelled')) {
        await gradeEvent({ ...data, id: editing.id });
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-all-predictions'] });
      closeForm();
    },
  });

  const remove = useMutation({
    mutationFn: async (event) => {
      // Delete all related predictions silently (no notifications)
      const preds = await base44.entities.Prediction.filter({ event_id: event.id });
      await Promise.all(preds.map(p => base44.entities.Prediction.delete(p.id)));
      return base44.entities.Event.delete(event.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-all-predictions'] });
    },
  });

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'delete') {
        await remove.mutateAsync(confirm.event);
      } else if (confirm.type === 'status') {
        const data = {
          title: confirm.event.title,
          home_team: confirm.event.home_team,
          away_team: confirm.event.away_team,
          description: confirm.event.description,
          category: 'football',
          options: FOOTBALL_OPTIONS,
          event_date: confirm.event.event_date,
          status: confirm.newStatus,
          correct_outcome: confirm.event.correct_outcome,
          image_url: confirm.event.image_url,
          pledge_amount: confirm.event.pledge_amount,
        };
        await base44.entities.Event.update(confirm.event.id, data);
        if (confirm.newStatus === 'completed' || confirm.newStatus === 'cancelled') {
          await gradeEvent({ ...confirm.event, status: confirm.newStatus, id: confirm.event.id });
        }
        qc.invalidateQueries({ queryKey: ['admin-events'] });
        qc.invalidateQueries({ queryKey: ['admin-all-predictions'] });
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({
      title: e.title || '',
      home_team: e.home_team || '',
      away_team: e.away_team || '',
      description: e.description || '',
      event_date: e.event_date ? e.event_date.slice(0, 16) : '',
      status: e.status || 'upcoming',
      correct_outcome: e.correct_outcome || '',
      image_url: e.image_url || '',
      pledge_amount: e.pledge_amount || 100,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const title = form.home_team && form.away_team
      ? `${form.home_team} vs ${form.away_team}`
      : form.title;

    const isTerminating = editing &&
      editing.status !== form.status &&
      (form.status === 'completed' || form.status === 'cancelled');

    if (isTerminating) {
      setConfirm({
        type: 'save_with_grade',
        event: editing,
        newStatus: form.status,
        formData: {
          title,
          home_team: form.home_team,
          away_team: form.away_team,
          description: form.description,
          category: 'football',
          options: FOOTBALL_OPTIONS,
          event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
          status: form.status,
          correct_outcome: form.correct_outcome || undefined,
          image_url: form.image_url || undefined,
          pledge_amount: Number(form.pledge_amount) || 100,
        },
      });
      closeForm();
      return;
    }

    save.mutate({
      title,
      home_team: form.home_team,
      away_team: form.away_team,
      description: form.description,
      category: 'football',
      options: FOOTBALL_OPTIONS,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
      status: form.status,
      correct_outcome: form.correct_outcome || undefined,
      image_url: form.image_url || undefined,
      pledge_amount: Number(form.pledge_amount) || 100,
    });
  };

  // Special confirm handler for save_with_grade
  const handleConfirmWrapper = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'delete') {
        await remove.mutateAsync(confirm.event);
      } else if (confirm.type === 'status') {
        const data = {
          title: confirm.event.title,
          home_team: confirm.event.home_team,
          away_team: confirm.event.away_team,
          description: confirm.event.description,
          category: 'football',
          options: FOOTBALL_OPTIONS,
          event_date: confirm.event.event_date,
          status: confirm.newStatus,
          correct_outcome: confirm.event.correct_outcome,
          image_url: confirm.event.image_url,
          pledge_amount: confirm.event.pledge_amount,
        };
        await base44.entities.Event.update(confirm.event.id, data);
        if (confirm.newStatus === 'completed' || confirm.newStatus === 'cancelled') {
          await gradeEvent({ ...confirm.event, status: confirm.newStatus, id: confirm.event.id });
        }
        qc.invalidateQueries({ queryKey: ['admin-events'] });
        qc.invalidateQueries({ queryKey: ['admin-all-predictions'] });
      } else if (confirm.type === 'save_with_grade') {
        await base44.entities.Event.update(confirm.event.id, confirm.formData);
        if (confirm.formData.status === 'completed' || confirm.formData.status === 'cancelled') {
          await gradeEvent({ ...confirm.formData, id: confirm.event.id });
        }
        qc.invalidateQueries({ queryKey: ['admin-events'] });
        qc.invalidateQueries({ queryKey: ['admin-all-predictions'] });
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // Filter + sort
  let filtered = events.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  filtered = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'date') {
      aVal = new Date(a.event_date || 0).getTime();
      bVal = new Date(b.event_date || 0).getTime();
    } else if (sortField === 'predictions') {
      aVal = predCountByEvent[a.id] || 0;
      bVal = predCountByEvent[b.id] || 0;
    } else if (sortField === 'pledges') {
      aVal = pledgeSumByEvent[a.id] || 0;
      bVal = pledgeSumByEvent[b.id] || 0;
    } else {
      aVal = a.pledge_amount || 0;
      bVal = b.pledge_amount || 0;
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortTh = ({ field, children }) => (
    <th
      className="text-left text-xs text-slate-500 font-semibold px-4 py-3 cursor-pointer hover:text-slate-300 transition-colors select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-yellow-400' : 'opacity-40'}`} />
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === 'delete' ? 'Delete Event?' :
          confirm?.type === 'save_with_grade' ? `Mark as ${confirm?.newStatus}?` :
          `Change Status to "${confirm?.newStatus}"?`
        }
        message={
          confirm?.type === 'delete'
            ? `This will permanently delete "${confirm?.event?.title}" and all related predictions. This cannot be undone.`
            : `This will grade all predictions for "${confirm?.event?.title || confirm?.formData?.title}" and notify users. This cannot be reversed.`
        }
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : 'Confirm'}
        variant={confirm?.type === 'delete' ? 'destructive' : 'warning'}
        loading={confirmLoading}
        onConfirm={handleConfirmWrapper}
        onCancel={() => setConfirm(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Events</h1>
          <p className="text-slate-500 text-sm">Football matches for predictions</p>
        </div>
        <Button onClick={openNew} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'upcoming', 'live', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-bold text-white">{editing ? 'Edit Event' : 'New Football Event'}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Home Team *</Label>
                  <Input value={form.home_team} onChange={e => setForm(f => ({ ...f, home_team: e.target.value }))}
                    placeholder="e.g. Arsenal" required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Away Team *</Label>
                  <Input value={form.away_team} onChange={e => setForm(f => ({ ...f, away_team: e.target.value }))}
                    placeholder="e.g. Chelsea" required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="League, competition..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
              </div>

              <div>
                <Label className="text-slate-300 text-xs mb-2 block">Prediction Options (fixed)</Label>
                <div className="flex gap-2 flex-wrap">
                  {FOOTBALL_OPTIONS.map(o => (
                    <span key={o.value} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 font-medium">{o.label}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Match Date & Time</Label>
                  <Input type="datetime-local" value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Pledge Amount (₦)</Label>
                  <Input type="number" value={form.pledge_amount} min={50}
                    onChange={e => setForm(f => ({ ...f, pledge_amount: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {['upcoming', 'live', 'completed', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">Correct Outcome (if done)</Label>
                  <Select value={form.correct_outcome || ''} onValueChange={v => setForm(f => ({ ...f, correct_outcome: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="None yet" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none" className="text-slate-400">None yet</SelectItem>
                      {FOOTBALL_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Image URL (optional)</Label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={save.isPending}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold gap-2">
                  {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Event'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm} className="text-slate-400 hover:text-white">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No events found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <SortTh field="date">Match / Date</SortTh>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3">Status</th>
                <SortTh field="predictions">Predictions</SortTh>
                <SortTh field="pledges">Pledged</SortTh>
                <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 hidden lg:table-cell">Result</th>
                <th className="px-4 py-3 w-24 text-xs text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const pCount = predCountByEvent[e.id] || 0;
                const pSum = pledgeSumByEvent[e.id] || 0;
                return (
                  <tr key={e.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white truncate max-w-[200px]">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {e.event_date ? format(new Date(e.event_date), 'MMM d, yyyy HH:mm') : '—'}
                        {e.description && ` · ${e.description}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={e.status}
                        onValueChange={(newStatus) => {
                          if (newStatus === e.status) return;
                          if (newStatus === 'completed' || newStatus === 'cancelled') {
                            setConfirm({ type: 'status', event: e, newStatus });
                          } else {
                            base44.entities.Event.update(e.id, { status: newStatus })
                              .then(() => qc.invalidateQueries({ queryKey: ['admin-events'] }));
                          }
                        }}
                      >
                        <SelectTrigger className={`w-28 h-7 text-xs font-semibold border rounded-md px-2 ${STATUS_COLORS[e.status]} bg-transparent`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {['upcoming', 'live', 'completed', 'cancelled'].map(s => (
                            <SelectItem key={s} value={s} className="text-white capitalize text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-sm font-bold text-white">{pCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-400">₦{pSum.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {e.correct_outcome
                        ? FOOTBALL_OPTIONS.find(o => o.value === e.correct_outcome)?.label || e.correct_outcome
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirm({ type: 'delete', event: e })}
                          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
}