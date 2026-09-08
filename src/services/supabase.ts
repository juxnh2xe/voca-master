import { createClient } from '@supabase/supabase-js';
import { Word, Folder } from '../types/voca';
import { db } from '../db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zcpxudbpvkghbiyquxpa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BVeOZOLOTfyQEEzkJqViFA_AHVnzd4a';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== 데이터 변환 유틸리티 ====================

/**
 * 공용 단어(words) 테이블용 행 변환
 * (개인별 SRS 학습 진행도는 별도의 user_word_progress에 저장하므로 words 테이블에는 단어 본문만 전달)
 */
export const wordToRow = (w: Word) => ({
  id: w.id,
  word: w.word,
  meaning: w.meaning,
  set_id: w.setId || null,
  set_name: w.setName || null,
  folder_id: w.folderId || null,
  examples: w.examples || [],
  created_at: w.createdAt || new Date().toISOString(),
});

export const rowToWord = (r: any): Word => ({
  id: r.id,
  word: r.word,
  meaning: r.meaning,
  setId: r.set_id || undefined,
  setName: r.set_name || undefined,
  folderId: r.folder_id || null,
  examples: r.examples || [],
  // 기본 SRS 학습 상태 (사용자별 진행도 병합 전 기본값 0)
  srsLevel: 0,
  consecutiveCorrect: 0,
  nextReviewDate: new Date().toISOString().split('T')[0],
  isWeak: false,
  totalReviews: 0,
  totalCorrect: 0,
  lastReviewedAt: undefined,
  createdAt: r.created_at || new Date().toISOString(),
  updatedAt: r.created_at || new Date().toISOString(),
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
 * 공용 단어/폴더 및 사용자별 개별 학습 진행도 동기화
 * - 단어와 폴더는 모든 사용자가 공유
 * - 학습 진행도(SRS)는 로그인한 사용자(userId)의 기록만 결합하여 로컬 DB에 반영
 */
export const syncFromCloud = async (userId?: string): Promise<{ wordsCount: number; foldersCount: number; isSuccess: boolean }> => {
  try {
    // 0. 미전송 오프라인 학습 기록이 있다면 클라우드로 먼저 업로드하여 덮어쓰기 방지
    if (userId && typeof navigator !== 'undefined' && navigator.onLine) {
      await flushSyncQueue(userId);
    }

    // 1. Supabase 공용 폴더 동기화
    const { data: cloudFolders, error: folderErr } = await supabase.from('folders').select('*');
    if (folderErr) throw folderErr;

    const cloudFolderIds = new Set((cloudFolders || []).map((f: any) => f.id));
    const localFolders = await db.folders.toArray();
    const staleFolderIds = localFolders.filter((f) => !cloudFolderIds.has(f.id)).map((f) => f.id);
    if (staleFolderIds.length > 0) {
      await db.folders.bulkDelete(staleFolderIds);
    }
    if (cloudFolders && cloudFolders.length > 0) {
      const convertedFolders = cloudFolders.map(rowToFolder);
      await db.folders.bulkPut(convertedFolders);
    }

    // 2. Supabase 공용 단어 조회
    const { data: cloudWords, error: wordErr } = await supabase.from('words').select('*');
    if (wordErr) throw wordErr;

    // 3. 사용자별 개별 학습 진행도 조회 (로그인된 경우)
    const userProgressMap = new Map<string, any>();
    if (userId) {
      try {
        const { data: progressData, error: progressErr } = await supabase
          .from('user_word_progress')
          .select('*')
          .eq('user_id', userId);

        if (!progressErr && progressData) {
          progressData.forEach((p: any) => {
            userProgressMap.set(p.word_id, p);
          });
        }
      } catch (pErr) {
        console.warn('user_word_progress 조회 실패 (로컬 모드 유지):', pErr);
      }
    }

    // 4. 단어와 개인 학습 진행도 병합 (Merge)
    const localWords = await db.words.toArray();
    const localWordMap = new Map(localWords.map((w) => [w.id, w]));
    const today = new Date().toISOString().split('T')[0];

    const convertedWords: Word[] = (cloudWords || []).map((r: any) => {
      const baseWord = rowToWord(r);

      if (userId) {
        // 로그인 회원: 클라우드 user_word_progress 테이블의 개인 기록 오버레이
        const progress = userProgressMap.get(r.id);
        if (progress) {
          return {
            ...baseWord,
            srsLevel: progress.srs_level ?? 0,
            consecutiveCorrect: progress.consecutive_correct ?? 0,
            nextReviewDate: progress.next_review_date || today,
            isWeak: progress.is_weak ?? false,
            totalReviews: progress.total_reviews ?? 0,
            lastReviewedAt: progress.last_reviewed_at || undefined,
          };
        } else {
          // 해당 단어를 아직 공부하지 않은 경우 0단계 신규로 시작
          return {
            ...baseWord,
            srsLevel: 0,
            consecutiveCorrect: 0,
            nextReviewDate: today,
            isWeak: false,
            totalReviews: 0,
            lastReviewedAt: undefined,
          };
        }
      } else {
        // 비로그인(게스트): 로컬 브라우저(IndexedDB)에 저장된 기존 진행도 유지
        const local = localWordMap.get(r.id);
        if (local) {
          return {
            ...baseWord,
            srsLevel: local.srsLevel,
            consecutiveCorrect: local.consecutiveCorrect,
            nextReviewDate: local.nextReviewDate,
            isWeak: local.isWeak,
            totalReviews: local.totalReviews,
            lastReviewedAt: local.lastReviewedAt,
          };
        }
        return baseWord;
      }
    });

    if (convertedWords.length > 0) {
      // 1순위: 클라우드 단어를 로컬에 즉시 저장
      await db.words.bulkPut(convertedWords);

      // 2순위: 저장이 성공한 후에만, 클라우드에서 실제 삭제된 오래된 단어를 로컬에서 정리
      const cloudWordIds = new Set(convertedWords.map((w) => w.id));
      const staleWordIds = localWords.filter((w) => !cloudWordIds.has(w.id)).map((w) => w.id);
      if (staleWordIds.length > 0) {
        await db.words.bulkDelete(staleWordIds);
      }
    }

    console.log(`[Supabase Sync] 동기화 성공: 공용 단어 ${convertedWords.length}개, 개인 학습 기록 ${userProgressMap.size}개`);
    return {
      wordsCount: convertedWords.length,
      foldersCount: cloudFolders ? cloudFolders.length : 0,
      isSuccess: true,
    };
  } catch (error) {
    console.warn('Supabase 클라우드 동기화 중 오류 (로컬 모드로 지속):', error);
    return { wordsCount: 0, foldersCount: 0, isSuccess: false };
  }
};

/**
 * 실시간 변경 감지 리스너 (단어, 폴더, 개인 학습 진행도 감지)
 */
export const initRealtimeSubscription = (onSyncNeeded: () => void) => {
  const channel = supabase
    .channel('voca-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'words' }, () => {
      onSyncNeeded();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => {
      onSyncNeeded();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_word_progress' }, () => {
      onSyncNeeded();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * 오프라인 상태에서 축적된 학습 진행도(syncQueue)를 Supabase에 일괄 전송 (재연결 시 자동 호출)
 */
export const flushSyncQueue = async (userId: string) => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const pendingItems = await db.syncQueue.where('userId').equals(userId).toArray();
    if (!pendingItems || pendingItems.length === 0) return;

    console.log(`[Offline Sync] 대기 중인 학습 진행도 ${pendingItems.length}개 클라우드로 업로드 시작...`);

    // wordId별로 가장 최신 업데이트만 선택하여 중복 전송 방지
    const latestByWord = new Map<string, typeof pendingItems[0]>();
    pendingItems.forEach((item) => {
      latestByWord.set(item.wordId, item);
    });

    const rows = Array.from(latestByWord.values()).map((item) => ({
      user_id: item.userId,
      word_id: item.wordId,
      srs_level: item.srsUpdate.srsLevel,
      consecutive_correct: item.srsUpdate.consecutiveCorrect,
      next_review_date: item.srsUpdate.nextReviewDate,
      is_weak: item.srsUpdate.isWeak,
      total_reviews: item.srsUpdate.totalReviews,
      last_reviewed_at: item.timestamp,
      updated_at: item.timestamp,
    }));

    const { error } = await supabase.from('user_word_progress').upsert(rows, { onConflict: 'user_id,word_id' });
    if (!error) {
      const idsToDelete = pendingItems.map((item) => item.id!).filter((id): id is number => id !== undefined);
      if (idsToDelete.length > 0) {
        await db.syncQueue.bulkDelete(idsToDelete);
      }
      console.log(`[Offline Sync] 오프라인 학습 진행도 ${rows.length}개 클라우드 동기화 완료!`);
    } else {
      console.warn('[Offline Sync] 클라우드 업로드 실패:', error.message);
    }
  } catch (err) {
    console.warn('[Offline Sync] 플러시 중 네트워크 오류:', err);
  }
};

/**
 * 사용자별 단어 학습 진행도 저장 (오프라인 지원: 오프라인 시 syncQueue에 자동 보관)
 */
export const saveUserWordProgress = async (
  userId: string,
  wordId: string,
  progress: {
    srsLevel: number;
    consecutiveCorrect: number;
    nextReviewDate: string;
    isWeak: boolean;
    totalReviews: number;
  }
) => {
  const now = new Date().toISOString();

  // 1. 브라우저가 오프라인 상태인 경우 즉시 로컬 큐에 보관
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      await db.syncQueue.add({
        userId,
        wordId,
        srsUpdate: {
          srsLevel: progress.srsLevel,
          consecutiveCorrect: progress.consecutiveCorrect,
          nextReviewDate: progress.nextReviewDate,
          isWeak: progress.isWeak,
          totalReviews: progress.totalReviews,
          totalCorrect: 0,
        },
        timestamp: now,
      });
      console.log(`[Offline Queue] 네트워크 오프라인: 단어(${wordId}) 진행도를 로컬 큐에 안전 보관`);
    } catch (e) {
      console.error('로컬 syncQueue 저장 실패:', e);
    }
    return;
  }

  // 2. 온라인 상태인 경우 클라우드로 전송 시도
  try {
    const { error } = await supabase.from('user_word_progress').upsert(
      {
        user_id: userId,
        word_id: wordId,
        srs_level: progress.srsLevel,
        consecutive_correct: progress.consecutiveCorrect,
        next_review_date: progress.nextReviewDate,
        is_weak: progress.isWeak,
        total_reviews: progress.totalReviews,
        last_reviewed_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,word_id' }
    );

    if (error) {
      console.warn('사용자 학습 진행도 저장 실패 -> 오프라인 큐에 보관:', error.message);
      await db.syncQueue.add({
        userId,
        wordId,
        srsUpdate: {
          srsLevel: progress.srsLevel,
          consecutiveCorrect: progress.consecutiveCorrect,
          nextReviewDate: progress.nextReviewDate,
          isWeak: progress.isWeak,
          totalReviews: progress.totalReviews,
          totalCorrect: 0,
        },
        timestamp: now,
      });
    }
  } catch (err) {
    console.warn('사용자 학습 진행도 네트워크 에러 -> 오프라인 큐에 보관:', err);
    try {
      await db.syncQueue.add({
        userId,
        wordId,
        srsUpdate: {
          srsLevel: progress.srsLevel,
          consecutiveCorrect: progress.consecutiveCorrect,
          nextReviewDate: progress.nextReviewDate,
          isWeak: progress.isWeak,
          totalReviews: progress.totalReviews,
          totalCorrect: 0,
        },
        timestamp: now,
      });
    } catch {
      // 무시
    }
  }
};

/**
 * 사용자별 개인 학습 진행도만 삭제 (공용 단어 및 타 사용자 기록 보존)
 */
export const resetUserStudyProgress = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_word_progress')
      .delete()
      .eq('user_id', userId);

    if (error) console.error('사용자 학습 진행도 초기화 실패:', error.message);
    else console.log('[Auth] 사용자 개별 학습 기록 초기화 완료');
  } catch (err) {
    console.error('사용자 학습 진행도 초기화 에러:', err);
  }
};

/**
 * 단일 단어를 Supabase 공용 라이브러리에 저장/수정
 */
export const saveWordToCloud = async (word: Word) => {
  try {
    const row = wordToRow(word);
    const { error } = await supabase.from('words').upsert(row);
    if (error) console.error('Supabase 단어 저장 실패:', error.message);
  } catch (err) {
    console.error('Supabase 단어 저장 네트워크 에러:', err);
  }
};

/**
 * 복수 단어 일괄 Supabase 공용 라이브러리에 저장
 */
export const saveMultipleWordsToCloud = async (words: Word[]) => {
  if (!words || words.length === 0) return;
  try {
    const rows = words.map(wordToRow);
    const { error } = await supabase.from('words').upsert(rows);
    if (error) console.error('Supabase 일괄 단어 저장 실패:', error.message);
  } catch (err) {
    console.error('Supabase 일괄 저장 네트워크 에러:', err);
  }
};

/**
 * Supabase 공용 라이브러리에서 단어 삭제
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
 * Supabase 공용 라이브러리에서 복수 단어 일괄 삭제
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

/**
 * 로그아웃 또는 계정 전환 시 로컬 IndexedDB 캐시 비우기
 */
export const clearLocalData = async () => {
  try {
    await db.words.clear();
    await db.folders.clear();
    console.log('[Auth] 로컬 데이터 캐시 정리 완료');
  } catch (err) {
    console.error('로컬 데이터 초기화 에러:', err);
  }
};


