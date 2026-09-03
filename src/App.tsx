import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Award, RotateCcw, BookOpen, Layers, PlusCircle, Sparkles, CheckCircle2, FileText, FolderTree, List, ArrowLeft } from 'lucide-react';

import { useWords } from './hooks/useWords';
import { useFolders } from './hooks/useFolders';
import { cleanSampleDataIfPresent } from './db';
import { syncFromCloud } from './services/supabase';
import { Word, TabType } from './types/voca';
import { EvaluationType, isDueToday } from './services/srs';

import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { Flashcard } from './components/study/Flashcard';
import { StudySetup } from './components/study/StudySetup';

import { AiBatchPaste } from './components/add/AiBatchPaste';
import { BundleWordForm } from './components/add/BundleWordForm';
import { SingleWordForm } from './components/add/SingleWordForm';

import { FourChoiceQuiz } from './components/quiz/FourChoiceQuiz';
import { CsatExam } from './components/quiz/CsatExam';
import { WordList } from './components/words/WordList';
import { FolderManager } from './components/folders/FolderManager';
import { StatsDashboard } from './components/dashboard/StatsDashboard';
import { HomeScreen } from './components/home/HomeScreen';

export const App: React.FC = () => {
  // 메인 탭: 'home' (홈 화면), 'study' (단어 암기), 'quiz' (퀴즈), 'manage' (단어 관리), 'dashboard' (대시보드)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // 퀴즈 탭 내 서브 모드: 'multiple' (객관식 퀴즈), 'blank' (빈칸 퀴즈)
  const [quizMode, setQuizMode] = useState<'multiple' | 'blank'>('multiple');

  // 단어 관리 탭 내 서브 탭: 'list' (단어 목록), 'add' (단어 추가), 'folders' (폴더 관리)
  const [manageSubTab, setManageSubTab] = useState<'list' | 'add' | 'folders'>('list');

  // 단어 추가 내 3대 방식: 'ai' (AI 일괄 등록), 'bundle' (세트 등록), 'single' (단일 등록)
  const [addMode, setAddMode] = useState<'ai' | 'bundle' | 'single'>('ai');

  // 현재 선택된 폴더
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // 단어 목록 탭 & 검색 상태
  const [wordListTab, setWordListTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 단어 번호 범위 필터 (#01 ~ #20 등)
  const [selectedRange, setSelectedRange] = useState<string | null>(null);

  // 암기 학습 세션 상태 (무한 사이클 재복습)
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [retryQueue, setRetryQueue] = useState<Word[]>([]);
  const [completedWords, setCompletedWords] = useState<Word[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [isStudying, setIsStudying] = useState(false);

  const {
    allWords,
    sortWordsByCluster,
    filterWords,
    getAvailableRanges,
    filterByRange,
    addWord,
    addMultipleWords,
    updateWord,
    deleteWord,
    deleteMultipleWords,
    recordEvaluation,
  } = useWords();

  const {
    folders,
    getBreadcrumbs,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useFolders();

  // 기존 샘플/예시 데이터 제거 및 Supabase 클라우드 동기화
  useEffect(() => {
    cleanSampleDataIfPresent();
    syncFromCloud();
  }, []);

  // 오늘 복습 대상 단어 수
  const dueTodayCount = allWords.filter(
    (w) => w.srsLevel === 0 || isDueToday(w.nextReviewDate)
  ).length;

  // 세션 설정(단어 ID 목록, 폴더 ID, 범위) 변경 감지용 Ref
  const prevSessionConfigRef = useRef<string>('');

  // 학습 대상 단어 목록 초기화 및 재구성
  useEffect(() => {
    // 단어들의 ID 목록과 현재 필터(폴더, 범위)로 고유 설정 키 생성
    const allWordIdsKey = allWords.map((w) => w.id).sort().join(',');
    const configKey = `${allWordIdsKey}|${currentFolderId || ''}|${selectedRange || ''}`;

    // 단어가 추가/삭제되었거나 사용자가 폴더/범위를 직접 변경했을 때만 세션 초기화!
    // (학습 도중 [정답]/[다시 복습]을 눌러 SRS 레벨 등 내부 필드가 갱신될 때는 currentIndex를 0으로 리셋하지 않음)
    if (prevSessionConfigRef.current !== configKey) {
      prevSessionConfigRef.current = configKey;

      let pool = allWords;
      if (currentFolderId) {
        pool = pool.filter((w) => w.folderId === currentFolderId);
      }

      // 연관 어휘 세트(#001) 클러스터링 정렬
      let sorted = sortWordsByCluster(pool);

      // 단어 번호 범위 필터 (#01 ~ #20 등)
      if (selectedRange) {
        sorted = filterByRange(sorted, selectedRange);
      }

      setSessionWords(sorted);
      setCurrentIndex(0);
      setCurrentCycle(1);
      setRetryQueue([]);
      setCompletedWords([]);
      setIsSessionFinished(false);
    }
  }, [allWords, currentFolderId, selectedRange]);

  // 3단계 평가 및 '오늘 다시 복습' 무한 사이클
  const handleEvaluation = async (evaluation: EvaluationType) => {
    if (sessionWords.length === 0) return;

    const currentWord = sessionWords[currentIndex];

    // 비동기 백그라운드로 DB에 평가 기록 (SRS 레벨 갱신 등)
    recordEvaluation(currentWord.id, evaluation);

    let nextRetryQueue = [...retryQueue];
    let nextCompleted = [...completedWords];

    if (evaluation === 'retry') {
      if (!nextRetryQueue.some((w) => w.id === currentWord.id)) {
        nextRetryQueue.push(currentWord);
        setRetryQueue(nextRetryQueue);
      }
    } else if (evaluation === 'exact') {
      if (!nextCompleted.some((w) => w.id === currentWord.id)) {
        nextCompleted.push(currentWord);
        setCompletedWords(nextCompleted);
      }
    }

    // 다음 단어로 진행
    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 1차 바퀴 완료 시 ➡️ 재복습 무한 사이클 판별
      if (nextRetryQueue.length > 0) {
        setSessionWords(sortWordsByCluster(nextRetryQueue));
        setRetryQueue([]);
        setCurrentIndex(0);
        setCurrentCycle((prev) => prev + 1);
      } else {
        setIsSessionFinished(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const restartStudySession = () => {
    let pool = allWords;
    if (currentFolderId) pool = pool.filter((w) => w.folderId === currentFolderId);
    let sorted = sortWordsByCluster(pool);
    if (selectedRange) sorted = filterByRange(sorted, selectedRange);

    setSessionWords(sorted);
    setCurrentIndex(0);
    setCurrentCycle(1);
    setRetryQueue([]);
    setCompletedWords([]);
    setIsSessionFinished(false);
  };

  const handleStartStudy = () => {
    restartStudySession();
    setIsStudying(true);
  };

  // 사전 설정 화면용 대상 단어 수 계산
  const targetWordsForSetup = (() => {
    let pool = allWords;
    if (currentFolderId) pool = pool.filter((w) => w.folderId === currentFolderId);
    let sorted = sortWordsByCluster(pool);
    if (selectedRange) sorted = filterByRange(sorted, selectedRange);
    return sorted.length;
  })();

  // 빵부스러기 경로
  const breadcrumbs = getBreadcrumbs(currentFolderId);

  // 사용 가능한 20단어 범위 목록
  const availableRanges = getAvailableRanges(
    currentFolderId ? allWords.filter((w) => w.folderId === currentFolderId) : allWords
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 4대 통합 메뉴 상단바 */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueTodayCount={dueTodayCount}
      />

      {/* 폴더 빵부스러기(Breadcrumb) 경로: 홈 화면이 아닐 때만 노출 */}
      {activeTab !== 'home' && (
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Breadcrumb
              items={breadcrumbs}
              onSelectFolder={(fId) => setCurrentFolderId(fId)}
            />

            {currentFolderId && (
              <button
                onClick={() => setCurrentFolderId(null)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
              >
                전체 단어장 보기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 메인 뷰 컨테이너 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* ======================= TAB 0: 홈 화면 (사이트 안내 및 공부 현황) ======================= */}
        {activeTab === 'home' && (
          <HomeScreen
            words={allWords}
            dueTodayCount={dueTodayCount}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ======================= TAB 1: 단어 암기 ======================= */}
        {activeTab === 'study' && (
          <div>
            {allWords.length === 0 ? (
              <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">등록된 단어가 없습니다</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    단어 관리 탭에서 단어를 등록하고 암기 학습을 시작해 보세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('manage');
                    setManageSubTab('add');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs"
                >
                  단어 추가하러 가기
                </button>
              </div>
            ) : !isStudying ? (
              /* 1. 학습 시작 전 설정 화면 (단어장 선택, 20단어 단위 범위 선택) */
              <StudySetup
                folders={folders}
                selectedFolderId={currentFolderId}
                onSelectFolder={(fId) => setCurrentFolderId(fId)}
                ranges={availableRanges}
                selectedRange={selectedRange}
                onSelectRange={(range) => setSelectedRange(range)}
                targetWordCount={targetWordsForSetup}
                onStartStudy={handleStartStudy}
              />
            ) : isSessionFinished ? (
              /* 2. 학습 완료 화면 */
              <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">학습 완료!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentCycle > 1 ? `${currentCycle}차 사이클을 거쳐 ` : ''}선택한 단어를 모두 암기했습니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={restartStudySession}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>다시 학습하기</span>
                  </button>
                  <button
                    onClick={() => setIsStudying(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                  >
                    범위 다시 선택
                  </button>
                </div>
              </div>
            ) : (
              /* 3. 학습 진행 화면: 오직 카드와 상단 심플 컨트롤만 표시 (집중 모드) */
              <div className="space-y-4">
                <div className="max-w-lg mx-auto flex items-center justify-between px-1">
                  <button
                    onClick={() => setIsStudying(false)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>범위 설정으로</span>
                  </button>

                  {currentCycle > 1 && (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      {currentCycle}차 재복습 진행 중
                    </span>
                  )}
                </div>

                {sessionWords.length > 0 && sessionWords[currentIndex] && (
                  <Flashcard
                    key={sessionWords[currentIndex].id}
                    word={sessionWords[currentIndex]}
                    onEvaluate={handleEvaluation}
                    index={currentIndex}
                    total={sessionWords.length}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: 퀴즈 (객관식 퀴즈 + 빈칸 퀴즈 통합) ======================= */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {/* 서브 토글 */}
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <button
                onClick={() => setQuizMode('multiple')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  quizMode === 'multiple'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>객관식 퀴즈</span>
              </button>

              <button
                onClick={() => setQuizMode('blank')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  quizMode === 'blank'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>빈칸 퀴즈</span>
              </button>
            </div>

            {quizMode === 'multiple' ? (
              <FourChoiceQuiz
                words={currentFolderId ? allWords.filter((w) => w.folderId === currentFolderId) : allWords}
              />
            ) : (
              <CsatExam
                words={currentFolderId ? allWords.filter((w) => w.folderId === currentFolderId) : allWords}
              />
            )}
          </div>
        )}

        {/* ======================= TAB 3: 단어 관리 (목록 + 추가 + 폴더 통합) ======================= */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* 관리 서브 네비게이션: 모바일에서 완벽한 3분할 탭 */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-sm mx-auto">
              <button
                onClick={() => setManageSubTab('list')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  manageSubTab === 'list'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>단어 목록</span>
              </button>

              <button
                onClick={() => setManageSubTab('add')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  manageSubTab === 'add'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>단어 추가</span>
              </button>

              <button
                onClick={() => setManageSubTab('folders')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  manageSubTab === 'folders'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>폴더 관리</span>
              </button>
            </div>

            {/* 1. 단어 목록 */}
            {manageSubTab === 'list' && (
              <WordList
                words={filterWords(wordListTab, searchQuery, currentFolderId)}
                totalWordCount={allWords.length}
                currentTab={wordListTab}
                onSelectTab={setWordListTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                folders={folders}
                onUpdateWord={updateWord}
                onDeleteWord={deleteWord}
                onDeleteMultipleWords={deleteMultipleWords}
              />
            )}

            {/* 2. 단어 추가 */}
            {manageSubTab === 'add' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-md mx-auto">
                  <button
                    onClick={() => setAddMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      addMode === 'ai'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">AI 등록</span>
                    <span className="hidden sm:inline">AI 일괄 등록 (PDF)</span>
                  </button>

                  <button
                    onClick={() => setAddMode('bundle')}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      addMode === 'bundle'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">세트 등록</span>
                    <span className="hidden sm:inline">연관 세트 등록</span>
                  </button>

                  <button
                    onClick={() => setAddMode('single')}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      addMode === 'single'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">단일 등록</span>
                    <span className="hidden sm:inline">단일 단어 등록</span>
                  </button>
                </div>

                {addMode === 'ai' && (
                  <AiBatchPaste
                    onSaveWords={addMultipleWords}
                    folders={folders}
                    currentFolderId={currentFolderId}
                  />
                )}

                {addMode === 'bundle' && (
                  <BundleWordForm
                    onSaveWords={addMultipleWords}
                    folders={folders}
                    currentFolderId={currentFolderId}
                  />
                )}

                {addMode === 'single' && (
                  <SingleWordForm
                    onSaveWord={addWord}
                    folders={folders}
                    currentFolderId={currentFolderId}
                  />
                )}
              </div>
            )}

            {/* 3. 폴더 관리 */}
            {manageSubTab === 'folders' && (
              <FolderManager
                folders={folders}
                words={allWords}
                currentFolderId={currentFolderId}
                onSelectFolder={(fId) => {
                  setCurrentFolderId(fId);
                  setManageSubTab('list');
                }}
                onAddFolder={addFolder}
                onUpdateFolder={updateFolder}
                onDeleteFolder={deleteFolder}
              />
            )}
          </div>
        )}

        {/* ======================= TAB 4: 대시보드 ======================= */}
        {activeTab === 'dashboard' && (
          <StatsDashboard words={allWords} />
        )}
      </main>
    </div>
  );
};

export default App;
