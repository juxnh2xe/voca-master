import React from 'react';
import { BookOpen, CheckCircle2, FolderCog, BarChart3, ArrowRight, Sparkles, Flame, Check, HelpCircle, FileText, PlusCircle } from 'lucide-react';
import { Word } from '../../types/voca';
import { ActiveTab } from '../layout/Navbar';

interface HomeScreenProps {
  words: Word[];
  dueTodayCount: number;
  onNavigate: (tab: ActiveTab) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  words,
  dueTodayCount,
  onNavigate,
}) => {
  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.srsLevel === 5).length;
  const inProgressWords = words.filter((w) => w.srsLevel > 0 && w.srsLevel < 5).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* 1. 웰컴 히어로 섹션 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>수능·내신 연계 어휘 맞춤 암기</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            기억에 오래 남는<br className="sm:hidden" /> 단어 암기의 시작, VocaMaster
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
            클래스카드 방식의 슬라이드 인출 암기와 수능형 퀴즈를 통해 헷갈리는 어휘를 확실하게 내 것으로 만드세요.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('study')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm shadow-md hover:bg-indigo-50 active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>단어 암기 시작</span>
            </button>

            <button
              onClick={() => onNavigate('manage')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새 단어 등록</span>
            </button>
          </div>
        </div>

        {/* 배경 은은한 데코 그래픽 */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* 2. 나의 공부 현황 대시보드 스냅샷 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 px-1">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>나의 어휘 학습 현황</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 총 등록 단어 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">총 등록 단어</span>
            <p className="text-2xl font-bold text-slate-800">
              {totalWords}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </p>
          </div>

          {/* 오늘 복습 대상 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 relative overflow-hidden">
            <span className="text-xs text-slate-500 font-medium">오늘 복습 대상</span>
            <p className="text-2xl font-bold text-rose-600">
              {dueTodayCount}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </p>
            {dueTodayCount > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>

          {/* 학습 진행 중 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">학습 진행 중</span>
            <p className="text-2xl font-bold text-indigo-600">
              {inProgressWords}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </p>
          </div>

          {/* 완전 정복 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">완전 정복 어휘</span>
            <p className="text-2xl font-bold text-emerald-600">
              {masteredWords}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. 주요 기능 바로가기 카드 그리드 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 px-1">주요 학습 기능</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 기능 1: 단어 암기 */}
          <div
            onClick={() => onNavigate('study')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                단어 암기
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                클래스카드 슬라이드 방식으로 영어 표제어를 먼저 보고, 아래로 내려 뜻과 기출 예문을 확인합니다.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>암기하러 가기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 기능 2: 퀴즈 */}
          <div
            onClick={() => onNavigate('quiz')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                퀴즈 (객관식 & 빈칸)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                4지선다 객관식 퀴즈와 문맥 속 빈칸 추론 문제로 인출 실전 감각을 완성합니다.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>퀴즈 풀러 가기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 기능 3: 단어 관리 */}
          <div
            onClick={() => onNavigate('manage')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderCog className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                단어 관리 및 추가
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                ChatGPT 프롬프트 1초 복사 일괄 등록, PDF 텍스트 추출, 단어장 폴더 정리를 지원합니다.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-amber-600">
              <span>단어장 관리하기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 기능 4: 대시보드 */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                대시보드 통계
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                학습 복습률, 취약 어휘 순위, 장기 기억 SRS 단계별 분포를 한눈에 파악합니다.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-purple-600">
              <span>통계 확인하기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 3단계 사용 가이드 */}
      <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>VocaMaster 효과적인 3단계 활용법</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-800">단어 등록</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              [단어 추가]에서 AI 프롬프트를 복사하거나 PDF를 불러와 나만의 단어장을 구성합니다.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-800">슬라이드 암기</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              영어 표제어를 먼저 떠올린 후, 카드를 아래로 슬라이드하여 한글 뜻과 예문을 확인합니다.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-800">퀴즈 인출</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              객관식 및 문맥 빈칸 퀴즈를 통해 틀리기 쉬운 어휘를 확실하게 장기 기억으로 고착화합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
