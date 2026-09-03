import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Word, TabType } from '../types/voca';
import { isDueToday, calculateSrsUpdate, EvaluationType } from '../services/srs';
import { saveWordToCloud, saveMultipleWordsToCloud, deleteWordFromCloud, deleteMultipleWordsFromCloud } from '../services/supabase';

export const useWords = () => {
  const allWords = useLiveQuery(() => db.words.toArray(), []) || [];

  // 1. 단어 클러스터 정렬 (연관 세트 #001 단어들이 흩어지지 않고 묶음 단위로 연속 배치)
  const sortWordsByCluster = (words: Word[]): Word[] => {
    return [...words].sort((a, b) => {
      // 1순위: setId (예: #001, #002)
      if (a.setId && b.setId) {
        if (a.setId !== b.setId) return a.setId.localeCompare(b.setId);
        return (a.orderInSet || 0) - (b.orderInSet || 0);
      }
      if (a.setId && !b.setId) return -1;
      if (!a.setId && b.setId) return 1;
      // 2순위: 생성일 역순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // 2. 5대 탭 분류 및 실시간 통합 검색 (철자, 뜻, 예문 문맥, 세트 번호)
  const filterWords = (
    tab: TabType,
    searchQuery: string = '',
    folderId: string | null = null
  ): Word[] => {
    let list = [...allWords];

    // 폴더 필터 (folderId가 지정된 경우)
    if (folderId) {
      list = list.filter((w) => w.folderId === folderId);
    }

    // 5대 탭 필터
    switch (tab) {
      case 'learning':
        list = list.filter((w) => w.srsLevel >= 1 && w.srsLevel <= 4);
        break;
      case 'mastered':
        list = list.filter((w) => w.srsLevel === 5);
        break;
      case 'weak':
        list = list.filter((w) => w.isWeak);
        break;
      case 'today':
        list = list.filter((w) => w.srsLevel === 0 || isDueToday(w.nextReviewDate));
        break;
      case 'all':
      default:
        break;
    }

    // 실시간 통합 초고속 검색 (표제어, 뜻, 예문 문장, 세트 번호)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((w) => {
        const matchWord = w.word.toLowerCase().includes(q);
        const matchMeaning = w.meaning.toLowerCase().includes(q);
        const matchSet = w.setId?.toLowerCase().includes(q) || w.setName?.toLowerCase().includes(q);
        const matchExample = w.examples.some(
          (ex) =>
            ex.sentence.toLowerCase().includes(q) ||
            ex.translation.toLowerCase().includes(q) ||
            (ex.year && ex.year.toLowerCase().includes(q))
        );
        return matchWord || matchMeaning || matchSet || matchExample;
      });
    }

    return sortWordsByCluster(list);
  };

  // 3. 단어 번호 범위 필터 (#01 ~ #20 등)
  const getAvailableRanges = (words: Word[]): string[] => {
    const total = words.length;
    if (total === 0) return [];

    const ranges: string[] = [];
    const step = 20;
    for (let i = 0; i < total; i += step) {
      const start = String(i + 1).padStart(2, '0');
      const end = String(Math.min(i + step, total)).padStart(2, '0');
      ranges.push(`#${start} ~ #${end}`);
    }
    return ranges;
  };

  const filterByRange = (words: Word[], rangeLabel: string): Word[] => {
    const match = rangeLabel.match(/#(\d+)\s*~\s*#(\d+)/);
    if (!match) return words;
    const startIdx = parseInt(match[1], 10) - 1;
    const endIdx = parseInt(match[2], 10);
    return words.slice(startIdx, endIdx);
  };

  // 4. CRUD & 평가
  const addWord = async (word: Word) => {
    await db.words.add(word);
    saveWordToCloud(word);
  };

  const addMultipleWords = async (words: Word[]) => {
    await db.words.bulkAdd(words);
    saveMultipleWordsToCloud(words);
  };

  const updateWord = async (id: string, changes: Partial<Word>) => {
    const updatedAt = new Date().toISOString();
    await db.words.update(id, { ...changes, updatedAt });
    const updated = await db.words.get(id);
    if (updated) saveWordToCloud(updated);
  };

  const deleteWord = async (id: string) => {
    await db.words.delete(id);
    deleteWordFromCloud(id);
  };

  const deleteMultipleWords = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    await db.words.bulkDelete(ids);
    deleteMultipleWordsFromCloud(ids);
  };

  const recordEvaluation = async (wordId: string, evaluation: EvaluationType) => {
    const word = await db.words.get(wordId);
    if (!word) return;

    const srsUpdate = calculateSrsUpdate(word, evaluation);
    const now = new Date().toISOString();
    await db.words.update(wordId, {
      ...srsUpdate,
      lastReviewedAt: now,
      updatedAt: now,
    });
    const updated = await db.words.get(wordId);
    if (updated) saveWordToCloud(updated);
  };

  return {
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
  };
};
