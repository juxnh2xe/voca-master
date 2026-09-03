import React from 'react';
import { RotateCcw, Flame } from 'lucide-react';

interface CycleReviewBarProps {
  currentCycle: number;
  retryQueueCount: number;
  completedCount: number;
  totalSessionWords: number;
}

export const CycleReviewBar: React.FC<CycleReviewBarProps> = ({
  currentCycle,
  retryQueueCount,
  completedCount,
  totalSessionWords,
}) => {
  const progressPercent =
    totalSessionWords > 0 ? Math.min(100, Math.round((completedCount / totalSessionWords) * 100)) : 0;

  return (
    <div className="w-full max-w-xl mx-auto mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Flame className="w-3.5 h-3.5 text-indigo-600" />
            {currentCycle}차 복습
          </span>

          {retryQueueCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] sm:text-xs">
              <RotateCcw className="w-3 h-3 text-rose-500" />
              재학습: {retryQueueCount}단어
            </span>
          )}
        </div>

        <span className="text-slate-500 text-[11px] sm:text-xs ml-auto">
          완료: <strong className="text-emerald-600">{completedCount}</strong> / {totalSessionWords} ({progressPercent}%)
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
