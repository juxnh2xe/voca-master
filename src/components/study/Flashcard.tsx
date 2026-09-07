import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, HelpCircle, RotateCcw, Layers, Eye, EyeOff } from 'lucide-react';
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
  // 새 단어가 출제될 때마다 항상 영단어만 보이는 상태(커튼 닫힘)로 초기화
  const [isRevealed, setIsRevealed] = useState(false);

  // 예문 한글 해석 열람 여부 개별 상태 관리 (기본값: 모두 숨김)
  const [revealedTranslationIds, setRevealedTranslationIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    setIsRevealed(false);
    setRevealedTranslationIds(new Set());
  }, [word.id]);

  // 개별 예문 한글 해석 토글
  const toggleTranslation = (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedTranslationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 모든 예문 한글 해석 일괄 토글
  const toggleAllTranslations = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!word.examples || word.examples.length === 0) return;
    const allIds = word.examples.map((ex, idx) => ex.id || idx);
    const isAllShown = allIds.every((id) => revealedTranslationIds.has(id));
    if (isAllShown) {
      setRevealedTranslationIds(new Set());
    } else {
      setRevealedTranslationIds(new Set(allIds));
    }
  };

  // 커튼 열기
  const handleOpenCurtain = () => {
    setIsRevealed(true);
  };

  // 커튼 닫기 (오직 지정된 접기 버튼 클릭 시에만 실행됨)
  const handleCloseCurtain = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(false);
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

      {/* 메인 클래스카드 카드: 연극장 커튼처럼 스크롤/슬라이드하여 열리는 UI */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative transition-all">
        {/* 상단 얇은 포인트 바 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-600" />

        {/* 1. 전면: 영어 표제어 (항상 먼저 노출) */}
        <div
          className="p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[220px]"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            English Word
          </span>

          {/* 깔끔하고 우아한 폰트 (font-semibold) */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight">
            {word.word}
          </h1>

          {/* 커튼이 닫혀 있을 때: 슬라이드/터치로 커튼 열기 안내 */}
          {!isRevealed ? (
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                // 아래로 25px 이상 드래그/슬라이드 시 커튼 열림
                if (info.offset.y > 25 || info.velocity.y > 80) {
                  handleOpenCurtain();
                }
              }}
              onClick={handleOpenCurtain}
              className="mt-8 flex flex-col items-center gap-1.5 py-3 px-6 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 transition-all cursor-pointer group active:scale-95 border border-indigo-100/80 shadow-2xs"
            >
              <span className="text-xs font-bold tracking-tight">
                아래로 슬라이드하여 뜻과 예문 열기
              </span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              </motion.div>
            </motion.div>
          ) : (
            /* 커튼이 열려 있을 때: 상단에서 바로 접을 수 있는 전용 접기 버튼 */
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={handleCloseCurtain}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-white border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>단어만 보기 (뜻 접기)</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. 후면: 연극장 커튼처럼 부드럽게 펼쳐지는 한국어 뜻 및 예문 영역 */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-slate-100 bg-slate-50/95 overflow-hidden"
            >
              {/* 스크롤 가능한 예문 본문 컨테이너 (터치/스크롤 시 절대 카드가 닫히지 않음) */}
              <div className="px-6 py-6 text-left space-y-5 max-h-[480px] overflow-y-auto">
                {/* 핵심 뜻 (부드러운 페이드인) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs text-center"
                >
                  <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                    Korean Meaning
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-700">
                    {word.meaning}
                  </p>
                </motion.div>

                {/* 기출 예문 영역 (예문이 있을 때만 단정하게 표시) */}
                {word.examples && word.examples.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.35 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>기출 예문</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({word.examples.length}개)
                        </span>
                      </span>

                      {/* 해석 모두 보기 / 접기 일괄 토글 버튼 */}
                      {word.examples.some((ex) => !!ex.translation) && (
                        <button
                          onClick={toggleAllTranslations}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 border border-indigo-100"
                          title="모든 예문의 해석을 한 번에 열거나 닫습니다"
                        >
                          {word.examples.map((ex, idx) => ex.id || idx).every((id) => revealedTranslationIds.has(id)) ? (
                            <>
                              <EyeOff className="w-3 h-3 text-indigo-500" />
                              <span>해석 모두 접기</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-indigo-500" />
                              <span>해석 모두 보기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {word.examples.map((ex, idx) => {
                      const isTranslationShown = revealedTranslationIds.has(ex.id || idx);
                      return (
                        <div
                          key={ex.id || idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-indigo-600">
                                #{idx + 1}
                              </span>
                              {ex.year && (
                                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {ex.year}
                                </span>
                              )}
                            </div>

                            {/* 개별 예문 해석 토글 버튼 */}
                            {ex.translation && (
                              <button
                                onClick={(e) => toggleTranslation(ex.id || idx, e)}
                                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                                  isTranslationShown
                                    ? 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                                    : 'text-indigo-600 bg-indigo-50/80 border-indigo-200 hover:bg-indigo-100'
                                }`}
                              >
                                {isTranslationShown ? (
                                  <>
                                    <EyeOff className="w-3 h-3 text-slate-400" />
                                    <span>해석 접기</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 text-indigo-500" />
                                    <span>해석 보기</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* 영어 예문 본문 */}
                          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-serif">
                            {renderHighlightedSentence(ex.sentence, word.word)}
                          </p>

                          {/* 한글 해석: 누르면 나타나고 다시 누르면 접힘 */}
                          <AnimatePresence>
                            {ex.translation && isTranslationShown && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p
                                  onClick={(e) => toggleTranslation(ex.id || idx, e)}
                                  className="text-xs sm:text-sm text-slate-700 font-sans p-3 bg-indigo-50/40 border border-indigo-100/80 rounded-xl leading-relaxed cursor-pointer hover:bg-indigo-50/60 transition-colors"
                                  title="클릭하면 해석이 다시 접힙니다"
                                >
                                  <span className="text-[10px] font-bold text-indigo-600 block mb-0.5">
                                    한글 해석:
                                  </span>
                                  {ex.translation}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* 예문 목록 하단 접기 전용 버튼 (긴 예문 읽은 후 하단에서 편하게 접기) */}
                <div className="pt-2 pb-1 text-center">
                  <button
                    onClick={handleCloseCurtain}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>위로 접고 단어만 보기</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 3단계 인출 평가 버튼: [다시 복습], [알 듯 말 듯], [정답] */}
      <div className="w-full grid grid-cols-3 gap-2.5 mt-5">
        {/* 다시 복습 */}
        <button
          onClick={() => onEvaluate('retry')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all shadow-2xs group cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-xs sm:text-sm">다시 복습</span>
        </button>

        {/* 알 듯 말 듯 */}
        <button
          onClick={() => onEvaluate('almost')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 active:scale-95 transition-all shadow-2xs group cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-xs sm:text-sm">알 듯 말 듯</span>
        </button>

        {/* 정답 */}
        <button
          onClick={() => onEvaluate('exact')}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm group cursor-pointer"
        >
          <Check className="w-4 h-4 text-white" />
          <span className="font-semibold text-xs sm:text-sm">정답</span>
        </button>
      </div>
    </div>
  );
};
