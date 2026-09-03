import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Word, TabType } from '../types/voca';
import { isDueToday, calculateSrsUpdate, EvaluationType } from '../services/srs';
import { saveWordToCloud, saveMultipleWordsToCloud, deleteWordFromCloud, deleteMultipleWordsFromCloud } from '../services/supabase';

export interface SetRangeGroup {
  label: string; // "#001 ~ #005"
  startNum: number;
  endNum: number;
  count: number;
}

export interface SingleSetItem {
  setId: string;
  setName?: string;
  num: number;
  count: number;
}

export const parseSetNum = (setId?: string): number | null => {
  if (!setId) return null;
  const m = setId.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

export const formatSetId = (num: number): string => {
  return `#${String(num).padStart(3, '0')}`;
};

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
      if (a.setId) return -1;
      if (b.setId) return 1;
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

  // 3-1. 세트 번호 5개 단위 묶음 범위 목록 (#001 ~ #005, #006 ~ #010 등)
  const getAvailableSetRanges = (words: Word[], step: number = 5): SetRangeGroup[] => {
    const nums: number[] = [];
    words.forEach((w) => {
      const n = parseSetNum(w.setId);
      if (n !== null) nums.push(n);
    });

    if (nums.length === 0) return [];

    const minNum = Math.min(...nums);
    const maxNum = Math.max(...nums);

    const groups: SetRangeGroup[] = [];
    const firstBlockStart = Math.floor((minNum - 1) / step) * step + 1;

    for (let start = firstBlockStart; start <= maxNum; start += step) {
      const end = start + step - 1;
      const count = words.filter((w) => {
        const n = parseSetNum(w.setId);
        return n !== null && n >= start && n <= end;
      }).length;

      if (count > 0) {
        groups.push({
          label: `${formatSetId(start)} ~ ${formatSetId(end)}`,
          startNum: start,
          endNum: end,
          count,
        });
      }
    }

    return groups;
  };

  // 3-2. 등록된 개별 세트 목록
  const getIndividualSets = (words: Word[]): SingleSetItem[] => {
    const map = new Map<string, { setName?: string; count: number; num: number }>();

    words.forEach((w) => {
      if (!w.setId) return;
      const id = w.setId.trim();
      const num = parseSetNum(id) || 0;
      const existing = map.get(id);
      if (existing) {
        existing.count += 1;
        if (!existing.setName && w.setName) existing.setName = w.setName;
      } else {
        map.set(id, { setName: w.setName, count: 1, num });
      }
    });

    return Array.from(map.entries())
      .map(([setId, info]) => ({
        setId,
        setName: info.setName,
        num: info.num,
        count: info.count,
      }))
      .sort((a, b) => a.num - b.num);
  };

  // 3-3. 세트 범위 또는 20단어 단위 목록 반환
  const getAvailableRanges = (words: Word[]): string[] => {
    const setGroups = getAvailableSetRanges(words);
    if (setGroups.length > 0) {
      return setGroups.map((g) => g.label);
    }

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

  // 3-4. 세트 범위 또는 단어 인덱스 범위로 필터링
  const filterByRange = (words: Word[], rangeLabel: string): Word[] => {
    if (!rangeLabel || rangeLabel === '전체') return words;

    // 1) 범위 형태 매칭: "#001 ~ #005"
    const rangeMatch = rangeLabel.match(/#?(\d+)\s*~\s*#?(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      // 세트 번호 기반 필터
      const hasSetIds = words.some((w) => !!w.setId);
      if (hasSetIds) {
        const filtered = words.filter((w) => {
          const n = parseSetNum(w.setId);
          return n !== null && n >= start && n <= end;
        });
        if (filtered.length > 0) return filtered;
      }

      // 세트 번호가 없거나 매칭되지 않는 경우 단어 인덱스 슬라이싱 (1-indexed)
      const startIdx = Math.max(0, start - 1);
      const endIdx = end;
      return words.slice(startIdx, endIdx);
    }

    // 2) 단일 세트 매칭: "#001"
    const singleMatch = rangeLabel.match(/#?(\d+)/);
    if (singleMatch) {
      const targetNum = parseInt(singleMatch[1], 10);
      const filtered = words.filter((w) => {
        const n = parseSetNum(w.setId);
        return n === targetNum || w.setId === rangeLabel;
      });
      if (filtered.length > 0) return filtered;
    }

    return words;
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
    getAvailableSetRanges,
    getIndividualSets,
    filterByRange,
    addWord,
    addMultipleWords,
    updateWord,
    deleteWord,
    deleteMultipleWords,
    recordEvaluation,
  };
};
