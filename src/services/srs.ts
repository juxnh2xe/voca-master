import { Word } from '../types/voca';

// 에빙하우스 망각 곡선 기반 간격 (단위: 일)
export const SRS_INTERVALS: Record<number, number> = {
  0: 0,   // 미학습 (당일)
  1: 1,   // 1일 뒤
  2: 3,   // 3일 뒤
  3: 7,   // 7일 뒤
  4: 14,  // 14일 뒤
  5: 30,  // 30일 뒤 (완전 정복)
};

export const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysToDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDueToday = (nextReviewDate: string): boolean => {
  const today = getTodayStr();
  return nextReviewDate <= today;
};

export type EvaluationType = 'exact' | 'almost' | 'retry';

export interface SrsCalculationResult {
  srsLevel: number;
  nextReviewDate: string;
  consecutiveCorrect: number;
  isWeak: boolean;
  totalReviews: number;
  totalCorrect: number;
}

export const calculateSrsUpdate = (
  word: Word,
  evaluation: EvaluationType
): SrsCalculationResult => {
  const today = getTodayStr();
  const totalReviews = (word.totalReviews || 0) + 1;

  if (evaluation === 'exact') {
    const newLevel = Math.min(5, (word.srsLevel || 0) + 1);
    const intervalDays = SRS_INTERVALS[newLevel] || 1;
    return {
      srsLevel: newLevel,
      nextReviewDate: addDaysToDate(today, intervalDays),
      consecutiveCorrect: (word.consecutiveCorrect || 0) + 1,
      isWeak: false,
      totalReviews,
      totalCorrect: (word.totalCorrect || 0) + 1,
    };
  }

  if (evaluation === 'almost') {
    // 레벨 유지하되 조만간 다시 확인하도록 1일 뒤 복습
    return {
      srsLevel: Math.max(1, word.srsLevel || 1),
      nextReviewDate: addDaysToDate(today, 1),
      consecutiveCorrect: word.consecutiveCorrect || 0,
      isWeak: word.isWeak,
      totalReviews,
      totalCorrect: word.totalCorrect || 0,
    };
  }

  // retry: 다시 복습
  return {
    srsLevel: 1, // 즉시 1단계로 강등
    nextReviewDate: addDaysToDate(today, 1), // 익일 복습 대상
    consecutiveCorrect: 0,
    isWeak: true, // 취약 단어로 분류
    totalReviews,
    totalCorrect: word.totalCorrect || 0,
  };
};
