import Dexie, { Table } from 'dexie';
import { Word, Folder } from '../types/voca';

export interface OfflineSyncItem {
  id?: number;
  userId: string;
  wordId: string;
  srsUpdate: {
    srsLevel: number;
    consecutiveCorrect: number;
    nextReviewDate: string;
    isWeak: boolean;
    totalReviews: number;
    totalCorrect: number;
  };
  timestamp: string;
}

export class VocaDatabase extends Dexie {
  words!: Table<Word, string>;
  folders!: Table<Folder, string>;
  syncQueue!: Table<OfflineSyncItem, number>;

  constructor() {
    super('VocaMasterDB');
    this.version(1).stores({
      words: 'id, word, setId, folderId, srsLevel, nextReviewDate, isWeak, createdAt',
      folders: 'id, name, parentId, createdAt',
    });
    this.version(2).stores({
      syncQueue: '++id, userId, wordId, timestamp',
    });
  }
}

export const db = new VocaDatabase();

// 기존 샘플/예시 데이터 제거 및 클린 상태 유지
export const cleanSampleDataIfPresent = async () => {
  try {
    const sampleWord = await db.words.where('id').startsWith('w_att').first();
    if (sampleWord) {
      await db.words.clear();
      await db.folders.clear();
    }
  } catch {
    // 무시
  }
};
