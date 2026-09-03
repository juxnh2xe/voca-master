import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, HelpCircle, RotateCcw, Layers } from 'lucide-react';
import { Word } from '../../types/voca';
import { EvaluationType } from '../../services/srs';

interface FlashcardProps {
  word: Word;
  onEvaluate: (type: EvaluationType) => void;
  index: number;
  total: number;
}

// 예문 내에서 현재 단어 볼드 하이라이트 (midlatitude 등 접두 결합형도 포괄 감지)
export const renderHighlightedSentence = (sentence: string, targetWord: string) => {
  if (!sentence) return null;
  if (!targetWord) return sentence;

  const cleanTarget = targetWord.trim().toLowerCase();
  const baseStem = cleanTarget.replace(/(e|s|ed|ing|tion|ly|al|ic)$/i, '');

  const regex = new RegExp(
    `(\\b[a-zA-Z-]*${cleanTarget}[a-zA-Z]*\\b|\\b[a-zA-Z-]*${baseStem}[a-zA-Z]*\\b)`,
    'gi'
  );

  const parts = sentence.split(regex);
  return (
    <span>
      {parts.map((part, i) => {
        const lower = part.toLowerCase();
        if (
          lower.includes(cleanTarget) ||
          (baseStem.length >= 3 && lower.includes(baseStem))
        ) {
          return (
            <span
              key={i}
              className="font-bold text-indigo-700 bg-indigo-50/80 px-1 py-0.5 rounded"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};

export const Flashcard: React.FC<FlashcardProps> = ({
  word,
  onEvaluate,
  index,
  total,
}) => {
  // 클래스카드 방식: 처음에는 영어 단어만 보이고, 아래로 슬라이드/터치해야 한글 뜻과 예문이 노출됨
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed((prev) => !prev);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* 카드 상단: 세트 정보와 진행도 */}
      <div className="w-full flex items-center justify-between mb-3 px-1 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          {word.setId && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{word.setId}</span>
            </div>
          )}
          {word.setName && (
            <span className="truncate max-w-[150px] sm:max-w-none text-slate-500">
              {word.setName}
            </span>
          )}
        </div>

        <div>
          <span className="font-semibold text-indigo-600">{index + 1}</span>
          <span className="mx-1 text-slate-400">/</span>
          <span>{total}</span>
        </div>
      </div>

      {/* 메인 클래스카드 카드 영역: 슬라이드 제스처 및 터치 지원 */}
      <motion.div
        layout
        onClick={handleReveal}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          // 아래로 25px 이상 드래그하거나 슬라이드하면 뜻 노출
          if (info.offset.y > 25 || info.velocity.y > 100) {
            setIsRevealed(true);
          } else if (info.offset.y < -25 || info.velocity.y < -100) {
            setIsRevealed(false);
          }
        }}
        className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer overflow-hidden relative"
      >
        {/* 상단 얇은 포인트 바 */}
        <div className="h-1 w-full bg-indigo-500" />

        {/* 1. 전면: 영어 표제어 (항상 먼저 노출) */}
        <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[220px]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            English Word
          </span>

          {/* 깔끔하고 우아한 폰트 (과도하게 굵지 않은 font-semibold) */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight">
            {word.word}
          </h1>

          {/* 아래로 슬라이드하여 뜻 확인 안내 인디케이터 */}
          <div className="mt-8 flex items-center gap-1 text-xs text-slate-400 font-medium animate-bounce">
            <span>{isRevealed ? '터치하여 뜻 숨기기' : '아래로 슬라이드하여 뜻 확인'}</span>
            <motion.div
              animate={{ rotate: isRevealed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </div>

        {/* 2. 후면: 아래로 슬라이드 시 부드럽게 펼쳐지는 한국어 뜻 및 예문 */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-slate-50/90 border-t border-slate-100 px-6 py-6 text-left space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핵심 뜻 */}
              <div className="text-center py-2">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                  Meaning
                </span>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  {word.meaning}
                </p>
              </div>

              {/* 예문 영역 (예문이 있을 때만 단정하게 표시) */}
              {word.examples && word.examples.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    예문 및 해석
                  </span>

                  {word.examples.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-indigo-600">
                          #{idx + 1}
                        </span>
                        {ex.year && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {ex.year}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-800 leading-relaxed font-serif">
                        {renderHighlightedSentence(ex.sentence, word.word)}
                      </p>

                      {ex.translation && (
                        <p className="text-xs text-slate-500 font-sans pt-1 border-t border-slate-100">
                          {ex.translation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. 3단계 인출 평가 버튼: 불필요한 개발자 용어(SRS, 큐, 승급 등)를 완전히 배제하고 핵심만 단정하게 제공 */}
      <div className="w-full grid grid-cols-3 gap-2.5 mt-5">
        {/* 다시 복습 */}
        <button
          onClick={() => onEvaluate('retry')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all shadow-2xs group"
        >
          <RotateCcw className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-xs sm:text-sm">다시 복습</span>
        </button>

        {/* 알 듯 말 듯 */}
        <button
          onClick={() => onEvaluate('almost')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 active:scale-95 transition-all shadow-2xs group"
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-xs sm:text-sm">알 듯 말 듯</span>
        </button>

        {/* 정답 */}
        <button
          onClick={() => onEvaluate('exact')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm group"
        >
          <Check className="w-4 h-4 text-white" />
          <span className="font-semibold text-xs sm:text-sm">정답</span>
        </button>
      </div>
    </div>
  );
};
