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
      words: 'id, word, setId, folderId, srsLevel, nextReviewDate, isWeak, createdAt',
      folders: 'id, name, parentId, createdAt',
      syncQueue: '++id, userId, wordId, timestamp',
    });
  }
}

export const db = new VocaDatabase();

// 하위 호환성을 위해 유지하되, 전체 데이터를 임의 삭제하지 않도록 안전 처리
export const cleanSampleDataIfPresent = async () => {
  // no-op: Supabase 클라우드 동기화가 공용 단어 무결성을 관리함
};
