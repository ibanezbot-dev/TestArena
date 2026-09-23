/**
 * Calculates points earned for a correct answer based on speed.
 * 
 * Formula: base_points + speed_bonus
 * - base_points: 1000 (for correct answer)
 * - speed_bonus: up to 1000 extra points based on how fast you answered
 * - incorrect: 0 points
 * 
 * Max possible: 2000 points per question
 */
export function calculatePoints(
  isCorrect: boolean,
  timeTakenMs: number,
  totalTimeMs: number
): number {
  if (!isCorrect) return 0;

  const BASE_POINTS = 1000;
  const MAX_SPEED_BONUS = 1000;

  // Clamp time taken to valid range
  const clampedTime = Math.max(0, Math.min(timeTakenMs, totalTimeMs));
  
  // Speed bonus: linear interpolation - faster = more points
  const speedRatio = 1 - clampedTime / totalTimeMs;
  const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio);

  return BASE_POINTS + speedBonus;
}

/**
 * Generates a random 6-digit PIN for the exam room.
 */
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
