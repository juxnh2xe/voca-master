import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word, QuizQuestion } from '../../types/voca';

interface FourChoiceQuizProps {
  words: Word[];
}

// 부드러운 웹 오디오 효과음 (외부 mp3 파일 없이 브라우저 내장 오디오 합성)
const playSound = (isCorrect: boolean) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (isCorrect) {
      // 맑은 딩동 소리
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      // 묵직한 오답 버저
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      osc.frequency.setValueAtTime(174.61, audioCtx.currentTime + 0.1); // F3
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch {
    // 오디오 미지원 시 조용히 무시
  }
};

export const FourChoiceQuiz: React.FC<FourChoiceQuizProps> = ({ words }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 퀴즈 문제 생성
  const generateQuiz = () => {
    if (words.length < 4) return;

    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    const generated: QuizQuestion[] = [];

    for (let i = 0; i < Math.min(10, shuffledWords.length); i++) {
      const current = shuffledWords[i];
      const isWordToMeaning = Math.random() > 0.4; // 60% 확률로 영->한

      // 오답 보기 3개 무작위 선택
      const otherWords = words.filter((w) => w.id !== current.id);
      const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);

      let prompt = '';
      let correctAnswer = '';
      let options: string[] = [];

      if (isWordToMeaning) {
        prompt = current.word;
        correctAnswer = current.meaning;
        options = [correctAnswer, ...distractors.map((d) => d.meaning)];
      } else {
        prompt = current.meaning;
        correctAnswer = current.word;
        options = [correctAnswer, ...distractors.map((d) => d.word)];
      }

      // 보기 4개 셔플
      options = options.sort(() => 0.5 - Math.random());

      generated.push({
        id: `q_${i}`,
        wordId: current.id,
        questionType: isWordToMeaning ? 'word_to_meaning' : 'meaning_to_word',
        prompt,
        correctAnswer,
        options,
        explanation: `${current.word} ➡️ ${current.meaning}`,
        examples: current.examples,
      });
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  useEffect(() => {
    generateQuiz();
  }, [words]);

  if (words.length < 4) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <HelpCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">단어가 4개 이상 필요합니다</h3>
        <p className="text-xs text-slate-500">
          객관식 퀴즈를 진행하려면 최소 4개 이상의 단어가 등록되어 있어야 합니다.
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-200/90 shadow-lg text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">퀴즈 완료</h2>
          <p className="text-sm text-slate-500 mt-1">총 {questions.length}문제 중 맞힌 개수</p>
        </div>

        <div className="text-4xl font-extrabold text-indigo-600">
          {score} / {questions.length}
          <span className="text-sm font-semibold text-slate-400 ml-2">
            ({Math.round((score / questions.length) * 100)}점)
          </span>
        </div>

        <button
          onClick={generateQuiz}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>새로운 퀴즈 다시 풀기</span>
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const correct = opt === currentQ.correctAnswer;
    if (correct) {
      setScore((prev) => prev + 1);
      playSound(true);
    } else {
      playSound(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* 퀴즈 헤더 */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {currentQ.questionType === 'word_to_meaning' ? '영단어 ➡️ 한글 뜻' : '한글 뜻 ➡️ 영단어'}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-500">
          문제 {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* 문제 카드 */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md text-center">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          알맞은 항목을 고르세요
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-6 font-serif">
          {currentQ.prompt}
        </h2>

        {/* 4지선다 보기 */}
        <div className="grid grid-cols-1 gap-2.5 text-left">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === currentQ.correctAnswer;

            let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
              } else {
                btnStyle = 'bg-slate-50/50 border-slate-200 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border-2 text-sm transition-all flex items-center justify-between ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/80 border border-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{opt}</span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 오답/정답 해설 창 */}
        {isAnswered && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>💡 정답 해설</span>
              <span className="text-indigo-600">{currentQ.explanation}</span>
            </div>
            {currentQ.examples && currentQ.examples.length > 0 && (
              <p className="text-slate-600 italic">
                "{currentQ.examples[0].sentence}" ({currentQ.examples[0].translation})
              </p>
            )}
          </div>
        )}
      </div>

      {/* 다음 문제 버튼 */}
      {isAnswered && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <span>{currentIndex + 1 < questions.length ? '다음 문제' : '결과 확인'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
