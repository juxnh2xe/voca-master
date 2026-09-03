export interface Example {
  id: string;
  year?: string; // e.g. "24.11", "18.06", "23 수능"
  sentence: string; // "His humble attitude toward criticism won respect."
  translation: string; // "비판에 대한 그의 겸손한 태도는 존경을 받았다."
}

export interface Word {
  id: string;
  word: string; // 표제어: "attitude"
  meaning: string; // 핵심 의미: "태도, 자세, 사고방식"
  setId?: string; // 연관 세트 번호: "#001", "#002"
  setName?: string; // 세트 명칭: "혼동 어휘 3총사"
  orderInSet?: number; // 세트 내 순서
  folderId?: string | null; // 소속 폴더/단어장 ID (null이면 루트)
  examples: Example[]; // 다중 예문 목록
  
  // SRS Leitner 상태 관리
  srsLevel: number; // 0 ~ 5 단계
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string; // ISO String
  consecutiveCorrect: number; // 연속 정답 횟수
  
  // 상태 분류 태그
  isWeak: boolean; // 최근 [다시 복습]을 눌러 취약 단어로 분류됨
  totalReviews: number;
  totalCorrect: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // 무한 중첩 계층형 트리
  description?: string;
  createdAt: string;
}

export interface StudySessionState {
  allWords: Word[];
  currentIndex: number;
  currentCycle: number; // 1차 사이클, 2차 사이클(재복습)...
  retryQueue: Word[]; // '오늘 다시 복습' 격리 큐
  completedWords: Word[]; // 당일 마스터 완료 단어들
  sessionStats: {
    exactCount: number;
    almostCount: number;
    retryCount: number;
  };
}

export type TabType = 'all' | 'learning' | 'mastered' | 'weak' | 'today';

export interface QuizQuestion {
  id: string;
  wordId: string;
  questionType: 'word_to_meaning' | 'meaning_to_word';
  prompt: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  examples?: Example[];
}

export interface ExamQuestion {
  id: string;
  wordId: string;
  targetWord: string;
  meaning: string;
  year?: string;
  maskedSentence: string; // e.g. "His humble [ 빈칸 ] won respect."
  fullSentence: string;
  translation: string;
  options: string[];
  userAnswer?: string;
  isCorrect?: boolean;
}
