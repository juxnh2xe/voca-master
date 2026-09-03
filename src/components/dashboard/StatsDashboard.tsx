import React from 'react';
import { BarChart3, Award, Flame, AlertCircle, CheckCircle, Clock, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { Word } from '../../types/voca';
import { isDueToday, getTodayStr } from '../../services/srs';

interface StatsDashboardProps {
  words: Word[];
  onStartWeakReview?: (weakWords: Word[]) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ words, onStartWeakReview }) => {
  const total = words.length;
  const today = getTodayStr();

  // 1. 상태별 통계 계산
  const masteredWords = words.filter((w) => w.srsLevel === 5);
  const learningWords = words.filter((w) => w.srsLevel >= 1 && w.srsLevel <= 4);
  const newWords = words.filter((w) => w.srsLevel === 0);
  const weakWords = words.filter((w) => w.isWeak);
  const dueTodayWords = words.filter((w) => w.srsLevel === 0 || isDueToday(w.nextReviewDate));

  // 오늘 학습한 단어 수 (lastReviewedAt이 오늘인 경우)
  const studiedTodayWords = words.filter((w) => w.lastReviewedAt && w.lastReviewedAt.startsWith(today));

  // 총 누적 복습 횟수
  const totalReviewsCount = words.reduce((acc, w) => acc + (w.totalReviews || 0), 0);

  // 완전 정복 진도율 (%)
  const masteredPercent = total > 0 ? Math.round((masteredWords.length / total) * 100) : 0;

  // 2. 취약 단어 TOP 5 랭킹 계산 (오답 횟수 = totalReviews - totalCorrect)
  const topWeakWords = [...words]
    .map((w) => ({
      ...w,
      wrongCount: Math.max(0, (w.totalReviews || 0) - (w.totalCorrect || 0)),
    }))
    .filter((w) => w.isWeak || w.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  // 3. 게이미피케이션 배지 산출
  const badges = [
    {
      title: '첫 출발',
      desc: '단어 5개 이상 등록',
      icon: '🌱',
      achieved: total >= 5,
    },
    {
      title: '완전 정복',
      desc: 'Lv 5 도달 단어 달성',
      icon: '🏛️',
      achieved: masteredWords.length >= 1,
    },
    {
      title: '복습 마스터',
      desc: '누적 복습 20회 달성',
      icon: '🏆',
      achieved: totalReviewsCount >= 20,
    },
    {
      title: '열공 달성',
      desc: '오늘 단어 10개 학습',
      icon: '🔥',
      achieved: studiedTodayWords.length >= 10,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 상단 핵심 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>오늘 복습 대상</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600">{dueTodayWords.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">복습 주기 도래</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>오늘 학습 단어</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{studiedTodayWords.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">당일 학습 완료</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>완전 정복 (Lv 5)</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600">{masteredWords.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">정복 단어</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>누적 복습 횟수</span>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-black text-violet-600">{totalReviewsCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">누적 복습</span>
        </div>
      </div>

      {/* 완전 정복 진도율 프로그레스 바 */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">단어장 완전 정복 진도율</h3>
          </div>
          <span className="text-xl font-black text-indigo-600">{masteredPercent}%</span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${masteredPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
          <span>전체 {total}개 단어 중 <strong>{masteredWords.length}개</strong> 완전 정복</span>
          <span>미학습: {newWords.length}개 · 학습 중: {learningWords.length}개</span>
        </div>
      </div>

      {/* 하단: 취약 단어 상위 랭킹 & 연속 출석/달성 배지 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* 취약 단어 TOP 5 랭킹 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              취약 단어 집중 공략 랭킹
            </h3>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
              총 {weakWords.length}개 취약
            </span>
          </div>

          {topWeakWords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              아직 취약 단어가 없습니다. 완벽하게 학습 중입니다! 🎉
            </div>
          ) : (
            <div className="space-y-2.5">
              {topWeakWords.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-900">{w.word}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{w.meaning}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-rose-600 bg-white px-2 py-1 rounded-lg border border-rose-200">
                    {w.wrongCount}회 오답
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 연속 출석 및 학습 달성 배지 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              연속 출석 스트릭 & 성취 배지
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              🔥 1일차 연속
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {badges.map((b, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  b.achieved
                    ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                    : 'bg-slate-50 border-slate-100 opacity-50 text-slate-400'
                }`}
              >
                <div className="text-2xl mb-1">{b.icon}</div>
                <div>
                  <h4 className="text-xs font-bold">{b.title}</h4>
                  <p className="text-[10px] leading-tight mt-0.5">{b.desc}</p>
                </div>
                <span className="text-[10px] font-bold mt-2 text-right">
                  {b.achieved ? '달성 완료 ✓' : '도전 중'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
