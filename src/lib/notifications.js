/**
 * Notification helpers for Qada.Bet
 * Creates in-app notifications for users
 */
import { base44 } from '@/api/base44Client';

export async function createNotification({ user_email, type, title, message, related_id, related_type }) {
  return base44.entities.Notification.create({
    user_email,
    type,
    title,
    message,
    is_read: false,
    related_id: related_id || undefined,
    related_type: related_type || undefined,
  });
}

export async function markAllRead(userEmail) {
  const notes = await base44.entities.Notification.filter({ user_email: userEmail, is_read: false });
  await Promise.all(notes.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
}