/**
 * Event grading: when an event is marked completed/cancelled,
 * grade all related predictions, update wallets, send notifications + emails.
 */
import { base44 } from '@/api/base44Client';
import { buildEmailHtml, detailRow } from './emailTemplate';
import { createNotification } from './notifications';
import { POINTS_PER_CORRECT } from './scoring';

async function upsertWallet(userEmail, updates) {
  const wallets = await base44.entities.Wallet.filter({ user_email: userEmail });
  if (wallets.length > 0) {
    const w = wallets[0];
    return base44.entities.Wallet.update(w.id, {
      points: (w.points || 0) + (updates.points || 0),
      total_pledged: (w.total_pledged || 0) + (updates.total_pledged || 0),
      total_donated: (w.total_donated || 0) + (updates.total_donated || 0),
      correct_predictions: (w.correct_predictions || 0) + (updates.correct_predictions || 0),
      total_predictions: (w.total_predictions || 0) + (updates.total_predictions || 0),
    });
  } else {
    return base44.entities.Wallet.create({
      user_email: userEmail,
      points: updates.points || 0,
      total_pledged: updates.total_pledged || 0,
      total_donated: updates.total_donated || 0,
      correct_predictions: updates.correct_predictions || 0,
      total_predictions: updates.total_predictions || 0,
    });
  }
}

function buildPredictionEmail({ userName, eventTitle, selectedOutcome, result, pledgeAmount, causeName, points }) {
  const isCorrect = result === 'correct';
  const isCancelled = result === 'cancelled';

  const resultColor = isCorrect ? '#16a34a' : isCancelled ? '#6b7280' : '#dc2626';
  const resultLabel = isCorrect ? '✅ Correct Prediction!' : isCancelled ? '⚠️ Event Cancelled' : '❌ Incorrect Prediction';
  const resultMsg = isCorrect
    ? `Your prediction was right! <strong>+${points} point${points !== 1 ? 's' : ''}</strong> awarded.`
    : isCancelled
    ? `The event was cancelled. No points were deducted or awarded. Your pledge was not charged.`
    : `Better luck next time! Your pledge of ₦${pledgeAmount.toLocaleString()} went to <strong>${causeName}</strong>.`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a237e;">Prediction Result</h2>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi ${userName || 'there'}, here's the result for your prediction.</p>

    <div style="background:${resultColor}15;border:1.5px solid ${resultColor}40;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:800;color:${resultColor};">${resultLabel}</p>
      <p style="margin:8px 0 0;color:#444;font-size:14px;">${resultMsg}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Match', eventTitle)}
      ${detailRow('Your Pick', selectedOutcome)}
      ${detailRow('Cause', causeName)}
      ${detailRow('Pledge Amount', `₦${pledgeAmount.toLocaleString()}`)}
      ${isCorrect ? detailRow('Points Earned', `+${points}`, true) : ''}
    </table>

    <div style="text-align:center;">
      <a href="https://qada.bet/dashboard" style="display:inline-block;background:#1a237e;color:#fff;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">View Dashboard →</a>
    </div>
  `;

  return buildEmailHtml({
    preheader: `Your prediction result for ${eventTitle}: ${resultLabel}`,
    body,
  });
}

export async function gradeEvent(event) {
  const { id: eventId, title: eventTitle, correct_outcome, status } = event;

  // Fetch all predictions for this event
  const predictions = await base44.entities.Prediction.filter({ event_id: eventId });
  if (!predictions.length) return;

  const isCancelled = status === 'cancelled';

  await Promise.all(predictions.map(async (pred) => {
    if (pred.status !== 'pending') return; // already graded

    let newStatus = 'pending';
    let points = 0;

    if (isCancelled) {
      newStatus = 'cancelled';
    } else if (correct_outcome) {
      const isCorrect = pred.selected_outcome === correct_outcome;
      newStatus = isCorrect ? 'correct' : 'incorrect';
      if (isCorrect) points = POINTS_PER_CORRECT;
    } else {
      return; // no outcome set yet
    }

    // Update prediction (include points_earned for display)
    await base44.entities.Prediction.update(pred.id, { status: newStatus, points_earned: points });

    // Update wallet
    await upsertWallet(pred.created_by, {
      points,
      correct_predictions: newStatus === 'correct' ? 1 : 0,
      total_predictions: 1,
    });

    // In-app notification
    const notifType = isCancelled ? 'prediction_cancelled' : newStatus === 'correct' ? 'prediction_correct' : 'prediction_incorrect';
    const notifTitle = isCancelled
      ? `Event Cancelled: ${eventTitle}`
      : newStatus === 'correct'
      ? `🎉 Correct Prediction! +${points} points`
      : `Prediction Result: ${eventTitle}`;
    const notifMsg = isCancelled
      ? `The event "${eventTitle}" was cancelled. No points affected.`
      : newStatus === 'correct'
      ? `Your pick for "${eventTitle}" was correct! You earned ${points} points.`
      : `Your pick for "${eventTitle}" was incorrect. 0 points earned. Better luck next time!`;

    await createNotification({
      user_email: pred.created_by,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      related_id: pred.id,
      related_type: 'prediction',
    });

    // Email notification (if donor_email available)
    if (pred.created_by) {
      const outcomeLabels = { home_win: 'Home Win', draw: 'Draw', away_win: 'Away Win' };
      const emailHtml = buildPredictionEmail({
        userName: pred.created_by.split('@')[0],
        eventTitle,
        selectedOutcome: outcomeLabels[pred.selected_outcome] || pred.selected_outcome,
        result: newStatus,
        pledgeAmount: pred.pledge_amount || 0,
        causeName: pred.cause_name || 'a cause',
        points,
      });

      base44.integrations.Core.SendEmail({
        to: pred.created_by,
        subject: isCancelled
          ? `Event Cancelled: ${eventTitle}`
          : newStatus === 'correct'
          ? `✅ Correct Prediction - ${eventTitle}`
          : `❌ Prediction Result - ${eventTitle}`,
        body: emailHtml,
      }).catch(() => {}); // non-blocking
    }
  }));
}