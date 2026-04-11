import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, Trophy, Heart, XCircle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { markAllRead } from '@/lib/notifications';

const TYPE_ICONS = {
  prediction_correct: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  prediction_incorrect: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  prediction_cancelled: { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
  donation_received: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  event_live: { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50' },
  event_completed: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5' },
  event_cancelled: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  account_update: { icon: Info, color: 'text-primary', bg: 'bg-primary/5' },
  general: { icon: Info, color: 'text-primary', bg: 'bg-primary/5' },
};

export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = async () => {
    if (!userEmail) return;
    const data = await base44.entities.Notification.filter(
      { user_email: userEmail },
      '-created_date',
      30
    );
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifs();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        fetchNotifs();
      }
    });
    return unsub;
  }, [userEmail]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleMarkAllRead = async () => {
    await markAllRead(userEmail);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    await base44.entities.Notification.update(notif.id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const config = TYPE_ICONS[n.type] || TYPE_ICONS.general;
                  const Icon = config.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleMarkRead(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!n.is_read ? 'bg-primary/3' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {n.created_date ? format(new Date(n.created_date), 'MMM d, h:mm a') : ''}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}