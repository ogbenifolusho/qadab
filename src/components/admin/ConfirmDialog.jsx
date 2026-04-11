import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable confirmation dialog for admin actions.
 * Usage:
 *   <ConfirmDialog
 *     open={confirmOpen}
 *     title="Delete Event?"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     variant="destructive"  // or "warning"
 *     loading={isDeleting}
 *     onConfirm={handleConfirm}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'destructive', // destructive | warning
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const colors = variant === 'destructive'
    ? { icon: 'text-red-400', bg: 'bg-red-400/10', btn: 'bg-red-500 hover:bg-red-600 text-white' }
    : { icon: 'text-yellow-400', bg: 'bg-yellow-400/10', btn: 'bg-yellow-400 hover:bg-yellow-300 text-slate-900' };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
          <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">{title}</h3>
        {message && <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">{message}</p>}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 text-slate-400 hover:text-white"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 ${colors.btn}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}