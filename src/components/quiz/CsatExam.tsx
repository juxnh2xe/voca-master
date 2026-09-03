import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, FileText, RotateCcw, ArrowLeft, ArrowRight, Award, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word, ExamQuestion } from '../../types/voca';

interface CsatExamProps {
  words: Word[];
}

// 문맥 속 타겟 단어 마스킹 ([ 빈칸 ]) 함수: midlatitude 등 접두 결합형도 완벽 감지
export const createMaskedSentence = (
  sentence: string,
  targetWord: string
): { masked: string; isMatched: boolean } => {
  if (!sentence || !targetWord) return { masked: sentence, isMatched: false };

  const cleanTarget = targetWord.trim().toLowerCase();
  const baseStem = cleanTarget.replace(/(e|s|ed|ing|tion|ly|al|ic)$/i, '');

  // 1차 시도: 표준 단어 경계 (독립된 단어 및 기본 굴절형)
  const exactWordRegex = new RegExp(`\\b${baseStem}[a-zA-Z]*\\b|\\b${cleanTarget}\\b`, 'gi');
  if (exactWordRegex.test(sentence)) {
    return {
      masked: sentence.replace(exactWordRegex, '[   빈칸   ]'),
      isMatched: true,
    };
  }

  // 2차 시도: 접두사나 하이픈이 결합된 복합 파생어 (예: midlatitude, mid-latitude, sub-tropical 등)
  const compoundRegex = new RegExp(
    `\\b[a-zA-Z-]*${cleanTarget}[a-zA-Z]*\\b|\\b[a-zA-Z-]*${baseStem}[a-zA-Z]*\\b`,
    'gi'
  );
  if (compoundRegex.test(sentence)) {
    return {
      masked: sentence.replace(compoundRegex, '[   빈칸   ]'),
      isMatched: true,
    };
  }

  // 3차 시도: 구두점 등에 인접한 경우 유연한 치환
  const looseRegex = new RegExp(cleanTarget, 'gi');
  if (looseRegex.test(sentence)) {
    return {
      masked: sentence.replace(looseRegex, '[   빈칸   ]'),
      isMatched: true,
    };
  }

  // 4차 폴백: 문장에 단어가 누락된 경우
  return {
    masked: `${sentence} ( [   빈칸   ] )`,
    isMatched: false,
  };
};

export const CsatExam: React.FC<CsatExamProps> = ({ words }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(300); // 5분 기본 타이머

  // 예문이 있는 단어들 필터
  const eligibleWords = words.filter((w) => w.examples && w.examples.length > 0);

  // 시험 문제 생성
  const startExam = () => {
    if (eligibleWords.length < 4) return;

    const shuffled = [...eligibleWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    const generated: ExamQuestion[] = selected.map((word, idx) => {
      // 여러 예문 중 단어가 실제로 매칭되는 예문 우선 선택
      const matchingExample = word.examples.find(
        (ex) => createMaskedSentence(ex.sentence, word.word).isMatched
      ) || word.examples[0];

      // 문맥 속 타겟 단어 마스킹 ([ 빈칸 ])
      const { masked } = createMaskedSentence(matchingExample.sentence, word.word);

      // 오답 보기 3개 선택
      const others = words.filter((w) => w.id !== word.id);
      const distractors = [...others].sort(() => 0.5 - Math.random()).slice(0, 3).map((w) => w.word);

      const options = [word.word, ...distractors].sort(() => 0.5 - Math.random());

      return {
        id: `exam_q_${idx}`,
        wordId: word.id,
        targetWord: word.word,
        meaning: word.meaning,
        year: matchingExample.year,
        maskedSentence: masked,
        fullSentence: matchingExample.sentence,
        translation: matchingExample.translation,
        options,
      };
    });

    setQuestions(generated);
    setUserAnswers({});
    setCurrentIndex(0);
    setTimeLeft(generated.length * 60); // 문제당 1분
    setExamStarted(true);
    setExamSubmitted(false);
  };

  // 타이머 작동
  useEffect(() => {
    if (!examStarted || examSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeLeft]);

  const handleSelectAnswer = (qId: string, option: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (eligibleWords.length < 4) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">예문이 있는 단어가 부족합니다</h3>
        <p className="text-xs text-slate-500">
          빈칸 퀴즈를 진행하려면 예문이 등록된 단어가 최소 4개 이상 필요합니다.
        </p>
      </div>
    );
  }

  // 1. 시험 시작 전 설정 화면
  if (!examStarted) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">빈칸 퀴즈</h2>
          <p className="text-xs text-slate-500">
            문장 속 빈칸에 들어갈 알맞은 단어를 고르는 실전 문제 풀이입니다.
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              출제 문항 수 선택
            </label>
            <div className="flex gap-2">
              {[5, 10, Math.min(20, eligibleWords.length)].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    questionCount === cnt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cnt}문항 ({cnt}분)
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>✓ 출제 대상: 예문이 등록된 <strong>{eligibleWords.length}개</strong> 단어</p>
            <p>✓ 문항당 제한 시간: 1분 (실시간 타이머 적용)</p>
            <p>✓ 종료 후: 정답률 성적표 및 오답 분석 노트 제공</p>
          </div>
        </div>

        <button
          onClick={startExam}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
        >
          빈칸 퀴즈 시작하기
        </button>
      </div>
    );
  }

  // 2. 시험 종료 후 성적표 및 오답 노트 화면
  if (examSubmitted) {
    const total = questions.length;
    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.targetWord) correctCount++;
    });
    const percentage = Math.round((correctCount / total) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 성적표 헤더 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">퀴즈 결과 성적표</h2>
            <p className="text-xs text-slate-500 mt-1">
              문항별 정답 및 오답 분석표
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div>
              <span className="text-xs text-slate-400 font-bold block">맞힌 문항</span>
              <strong className="text-3xl font-black text-indigo-600">
                {correctCount} <span className="text-sm font-normal text-slate-500">/ {total}</span>
              </strong>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="text-xs text-slate-400 font-bold block">정답률</span>
              <strong className="text-3xl font-black text-emerald-600">
                {percentage}%
              </strong>
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={startExam}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700"
            >
              새로운 시험 재응시
            </button>
            <button
              onClick={() => setExamStarted(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
            >
              시험 설정으로 나가기
            </button>
          </div>
        </div>

        {/* 문항별 오답 분석 노트 */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            문항별 상세 오답 분석 노트
          </h3>

          {questions.map((q, idx) => {
            const userAns = userAnswers[q.id];
            const isCorrect = userAns === q.targetWord;

            return (
              <div
                key={q.id}
                className={`bg-white p-5 rounded-2xl border-2 shadow-2xs space-y-3 ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      문제 {idx + 1}
                    </span>
                    {q.year && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        {q.year} 기출
                      </span>
                    )}
                  </div>

                  <span
                    className={`flex items-center gap-1 text-xs font-bold ${
                      isCorrect ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> 정답
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> 오답
                      </>
                    )}
                  </span>
                </div>

                {/* 원문 및 해석 */}
                <p className="text-sm text-slate-800 font-serif leading-relaxed">
                  {q.fullSentence}
                </p>
                <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 font-sans">
                  {q.translation}
                </p>

                {/* 답안 비교 */}
                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">내 답안: </span>
                    <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-600'}>
                      {userAns || '(미선택)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">정답: </span>
                    <strong className="text-indigo-700 font-bold">
                      {q.targetWord} ({q.meaning})
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. 실제 시험 진행 중 화면 (OMR & 타이머)
  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 상단 타이머 및 OMR 네비게이터: 모바일 대응 */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold shrink-0">
          <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-indigo-600'}`} />
          <span className={timeLeft < 60 ? 'text-rose-600' : 'text-slate-800'}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* OMR 문항 버튼들 (가로 스크롤) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-1 max-w-[180px] sm:max-w-xs">
          {questions.map((q, idx) => {
            const answered = !!userAnswers[q.id];
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                    : answered
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmitExam}
          className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs shrink-0 whitespace-nowrap"
        >
          제출
        </button>
      </div>

      {/* 수능형 시험지 문제 영역 */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-900 text-white">
              문항 {currentIndex + 1}
            </span>
            {currentQ.year && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {currentQ.year} 기출
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            [빈칸 문제]
          </span>
        </div>

        {/* 빈칸 지문 */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 leading-relaxed font-serif text-base sm:text-lg text-slate-900">
          {currentQ.maskedSentence.split('[   빈칸   ]').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block mx-1 px-3 py-0.5 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50 font-sans font-bold text-indigo-700 text-sm">
                  {userAnswers[currentQ.id] || '________'}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 4지선다 선택지 */}
        <div className="grid grid-cols-1 gap-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = userAnswers[currentQ.id] === opt;
            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(currentQ.id, opt)}
                className={`p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center gap-3 text-left ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* 이전 / 다음 문항 네비게이션 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>이전 문항</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {currentIndex + 1} / {questions.length}
          </span>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-30"
          >
            <span>다음 문항</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
