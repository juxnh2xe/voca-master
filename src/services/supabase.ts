import { createClient } from '@supabase/supabase-js';
import { Word, Folder } from '../types/voca';
import { db } from '../db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zcpxudbpvkghbiyquxpa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BVeOZOLOTfyQEEzkJqViFA_AHVnzd4a';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== 데이터 변환 유틸리티 (CamelCase <-> Snake_Case) ====================

export const wordToRow = (w: Word) => ({
  id: w.id,
  word: w.word,
  meaning: w.meaning,
  set_id: w.setId || null,
  set_name: w.setName || null,
  order_in_set: w.orderInSet || null,
  folder_id: w.folderId || null,
  examples: w.examples || [],
  srs_level: w.srsLevel ?? 0,
  consecutive_correct: w.consecutiveCorrect ?? 0,
  next_review_date: w.nextReviewDate || null,
  is_weak: w.isWeak ?? false,
  total_reviews: w.totalReviews ?? 0,
  total_correct: w.totalCorrect ?? 0,
  last_reviewed_at: w.lastReviewedAt || null,
  created_at: w.createdAt || new Date().toISOString(),
  updated_at: w.updatedAt || new Date().toISOString(),
});

export const rowToWord = (r: any): Word => ({
  id: r.id,
  word: r.word,
  meaning: r.meaning,
  setId: r.set_id || undefined,
  setName: r.set_name || undefined,
  orderInSet: r.order_in_set || undefined,
  folderId: r.folder_id || null,
  examples: r.examples || [],
  srsLevel: r.srs_level ?? 0,
  consecutiveCorrect: r.consecutive_correct ?? 0,
  nextReviewDate: r.next_review_date || new Date().toISOString().split('T')[0],
  isWeak: r.is_weak ?? false,
  totalReviews: r.total_reviews ?? 0,
  totalCorrect: r.total_correct ?? 0,
  lastReviewedAt: r.last_reviewed_at || undefined,
  createdAt: r.created_at || new Date().toISOString(),
  updatedAt: r.updated_at || new Date().toISOString(),
});

export const folderToRow = (f: Folder) => ({
  id: f.id,
  name: f.name,
  parent_id: f.parentId || null,
  created_at: f.createdAt || new Date().toISOString(),
});

export const rowToFolder = (r: any): Folder => ({
  id: r.id,
  name: r.name,
  parentId: r.parent_id || null,
  createdAt: r.created_at || new Date().toISOString(),
});

// ==================== 실시간 클라우드 동기화 서비스 ====================

/**
 * 앱 시작 시 Supabase 클라우드에서 단어 및 폴더를 불러와 로컬 Dexie와 양방향 병합
 */
export const syncFromCloud = async (): Promise<{ wordsCount: number; foldersCount: number }> => {
  try {
    // 1. Supabase 폴더 동기화
    const { data: cloudFolders, error: folderErr } = await supabase.from('folders').select('*');
    if (folderErr) throw folderErr;

    if (cloudFolders && cloudFolders.length > 0) {
      const convertedFolders = cloudFolders.map(rowToFolder);
      await db.folders.bulkPut(convertedFolders);
    } else {
      // 클라우드가 비어있고 로컬에 폴더가 있으면 클라우드로 업로드
      const localFolders = await db.folders.toArray();
      if (localFolders.length > 0) {
        await supabase.from('folders').upsert(localFolders.map(folderToRow));
      }
    }

    // 2. Supabase 단어 동기화
    const { data: cloudWords, error: wordErr } = await supabase.from('words').select('*');
    if (wordErr) throw wordErr;

    if (cloudWords && cloudWords.length > 0) {
      const convertedWords = cloudWords.map(rowToWord);
      await db.words.bulkPut(convertedWords);
    } else {
      // 클라우드가 비어있고 로컬에 단어가 있으면 클라우드로 업로드
      const localWords = await db.words.toArray();
      if (localWords.length > 0) {
        await supabase.from('words').upsert(localWords.map(wordToRow));
      }
    }

    return {
      wordsCount: cloudWords ? cloudWords.length : 0,
      foldersCount: cloudFolders ? cloudFolders.length : 0,
    };
  } catch (error) {
    console.warn('Supabase 클라우드 동기화 중 오류 (로컬 모드로 지속):', error);
    return { wordsCount: 0, foldersCount: 0 };
  }
};

/**
 * 단일 단어를 Supabase에 저장/수정
 */
export const saveWordToCloud = async (word: Word) => {
  try {
    const { error } = await supabase.from('words').upsert(wordToRow(word));
    if (error) console.error('Supabase 단어 저장 실패:', error.message);
  } catch (err) {
    console.error('Supabase 단어 저장 네트워크 에러:', err);
  }
};

/**
 * 복수 단어 일괄 Supabase 저장
 */
export const saveMultipleWordsToCloud = async (words: Word[]) => {
  try {
    const rows = words.map(wordToRow);
    const { error } = await supabase.from('words').upsert(rows);
    if (error) console.error('Supabase 일괄 단어 저장 실패:', error.message);
  } catch (err) {
    console.error('Supabase 일괄 저장 네트워크 에러:', err);
  }
};

/**
 * Supabase에서 단어 삭제
 */
export const deleteWordFromCloud = async (wordId: string) => {
  try {
    const { error } = await supabase.from('words').delete().eq('id', wordId);
    if (error) console.error('Supabase 단어 삭제 실패:', error.message);
  } catch (err) {
    console.error('Supabase 단어 삭제 네트워크 에러:', err);
  }
};

/**
 * Supabase에서 복수 단어 일괄 삭제
 */
export const deleteMultipleWordsFromCloud = async (wordIds: string[]) => {
  if (!wordIds || wordIds.length === 0) return;
  try {
    const { error } = await supabase.from('words').delete().in('id', wordIds);
    if (error) console.error('Supabase 일괄 단어 삭제 실패:', error.message);
  } catch (err) {
    console.error('Supabase 일괄 단어 삭제 네트워크 에러:', err);
  }
};

/**
 * 폴더를 Supabase에 저장/수정
 */
export const saveFolderToCloud = async (folder: Folder) => {
  try {
    const { error } = await supabase.from('folders').upsert(folderToRow(folder));
    if (error) console.error('Supabase 폴더 저장 실패:', error.message);
  } catch (err) {
    console.error('Supabase 폴더 저장 네트워크 에러:', err);
  }
};

/**
 * Supabase에서 폴더 삭제
 */
export const deleteFolderFromCloud = async (folderId: string) => {
  try {
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) console.error('Supabase 폴더 삭제 실패:', error.message);
  } catch (err) {
    console.error('Supabase 폴더 삭제 네트워크 에러:', err);
  }
};
