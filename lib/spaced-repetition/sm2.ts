// SM-2 spaced repetition algorithm
// quality: 0-5 (0=complete blackout, 5=perfect recall)
export function sm2(params: {
  repetitions: number;
  interval: number;
  easeFactor: number;
  quality: number; // 0-5
}): { nextInterval: number; nextEaseFactor: number; nextRepetitions: number } {
  const { quality } = params;
  let { repetitions, interval, easeFactor } = params;

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return {
    nextInterval: interval,
    nextEaseFactor: easeFactor,
    nextRepetitions: repetitions,
  };
}

// Map simple 3-button UI to SM-2 quality scores
export const QUALITY = {
  hard: 2,
  good: 4,
  easy: 5,
} as const;
