/**
 * Qada.Bet unified scoring system
 * - 10 points per correct prediction
 * - 1 point per ₦500 donated (direct donations)
 */

export const POINTS_PER_CORRECT = 1;

export function getDonationPoints(amount) {
  if (amount >= 100000) return 20;
  if (amount >= 50001) return 10;
  if (amount >= 20001) return 5;
  if (amount >= 10001) return 3;
  if (amount >= 5001) return 2;
  if (amount >= 500) return 1;
  return 0;
}

export function calcPoints({ correctPredictions = 0, totalDonated = 0 }) {
  const predictionPoints = correctPredictions * POINTS_PER_CORRECT;
  const donationPoints = getDonationPoints(totalDonated);
  return predictionPoints + donationPoints;
}

export const MILESTONES = [
  { points: 10,    badge: '🌱 First Step',    color: 'bg-emerald-100 text-emerald-700' },
  { points: 100,   badge: '⚡ Activator',    color: 'bg-blue-100 text-blue-700' },
  { points: 300,   badge: '🔥 Catalyst',     color: 'bg-orange-100 text-orange-700' },
  { points: 500,   badge: '🏆 Champion',     color: 'bg-amber-100 text-amber-700' },
  { points: 1000,  badge: '👑 Legend',       color: 'bg-yellow-100 text-yellow-800' },
  { points: 2000,  badge: '🌍 World Changer', color: 'bg-purple-100 text-purple-700' },
];

export function getMilestone(points) {
  let current = null;
  for (const m of MILESTONES) {
    if (points >= m.points) current = m;
  }
  return current;
}

export function getNextMilestone(points) {
  return MILESTONES.find(m => m.points > points) || null;
}