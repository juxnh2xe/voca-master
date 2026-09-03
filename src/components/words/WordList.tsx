import React, { useState } from 'react';
import { Search, Sparkles, Layers, Folder as FolderIcon, Edit3, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Word, Folder, TabType } from '../../types/voca';
import { renderHighlightedSentence } from '../study/Flashcard';
import { WordEditModal } from './WordEditModal';

interface WordListProps {
  words: Word[];
  totalWordCount: number;
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  folders: Folder[];
  onUpdateWord: (id: string, changes: Partial<Word>) => Promise<void>;
  onDeleteWord: (id: string) => Promise<void>;
  onDeleteMultipleWords: (ids: string[]) => Promise<void>;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  totalWordCount,
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  folders,
  onUpdateWord,
  onDeleteWord,
  onDeleteMultipleWords,
}) => {
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [expandedWordIds, setExpandedWordIds] = useState<Set<string>>(new Set());
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFolderName = (folderId?: string | null) => {
    if (!folderId) return '전체 단어장';
    const f = folders.find((item) => item.id === folderId);
    return f ? f.name : '미분류';
  };

  // 다중 선택 토글
  const toggleSelectWord = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 전체 선택 / 해제 토글
  const toggleSelectAll = () => {
    if (words.length === 0) return;
    const allIds = words.map((w) => w.id);
    const areAllSelected = allIds.every((id) => selectedWordIds.has(id));

    if (areAllSelected) {
      setSelectedWordIds(new Set());
    } else {
      setSelectedWordIds(new Set(allIds));
    }
  };

  // 선택된 단어들 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedWordIds.size === 0) return;
    const count = selectedWordIds.size;
    if (confirm(`선택한 ${count}개 단어를 모두 삭제하시겠습니까?\n(클라우드와 로컬에서 영구 삭제됩니다.)`)) {
      await onDeleteMultipleWords(Array.from(selectedWordIds));
      setSelectedWordIds(new Set());
    }
  };

  const tabs: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'all', label: '전체' },
    { id: 'learning', label: '학습 중 (Lv 1~4)' },
    { id: 'mastered', label: '완전 정복 (Lv 5)' },
    { id: 'weak', label: '취약 단어' },
    { id: 'today', label: '오늘 복습' },
  ];

  const allVisibleSelected = words.length > 0 && words.every((w) => selectedWordIds.has(w.id));

  return (
    <div className="space-y-5">
      <WordEditModal
        word={editingWord}
        isOpen={!!editingWord}
        onClose={() => setEditingWord(null)}
        onSave={onUpdateWord}
        folders={folders}
      />

      {/* 상단 검색바 및 5대 탭 */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* 16. 실시간 통합 초고속 검색창 */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="단어 철자, 한국어 뜻, 기출 예문 본문, 세트 번호(#001) 실시간 검색..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full"
            >
              지우기
            </button>
          )}
        </div>

        {/* 17. 상태별 5대 탭 분류 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{t.label}</span>
                {t.id === 'all' && (
                  <span className="text-[10px] opacity-80">({totalWordCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 다중 선택 일괄 관리 툴바 */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors select-none"
          >
            {allVisibleSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>전체 선택 ({selectedWordIds.size}/{words.length})</span>
          </button>

          {selectedWordIds.size > 0 && (
            <button
              onClick={() => setSelectedWordIds(new Set())}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
            >
              선택 해제
            </button>
          )}
        </div>

        {/* 선택된 항목이 있을 때 일괄 삭제 버튼 활성화 */}
        {selectedWordIds.size > 0 ? (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>선택한 {selectedWordIds.size}개 일괄 삭제</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span>검색 및 필터: {words.length}개</span>
            <span>세트 순 정렬</span>
          </div>
        )}
      </div>

      {/* 단어 목록 결과 */}
      <div className="space-y-3">
        {words.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">해당 조건의 단어가 없습니다</p>
            <p className="text-xs text-slate-400">
              다른 탭을 선택하거나 검색어를 변경해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {words.map((w) => {
              const isExpanded = expandedWordIds.has(w.id);
              const isSelected = selectedWordIds.has(w.id);

              return (
                <div
                  key={w.id}
                  className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-200'
                      : 'border-slate-200/90 shadow-2xs hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* 개별 선택 체크박스 */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectWord(w.id)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {w.setId && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Layers className="w-3 h-3" />
                                {w.setId}
                              </span>
                            )}

                            <span className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                              {w.word}
                            </span>

                            {/* 소속 단어장(폴더) 배지 */}
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                              <FolderIcon className="w-3 h-3 text-slate-400" />
                              {getFolderName(w.folderId)}
                            </span>

                            {/* SRS 레벨 배지 */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                w.srsLevel === 5
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : w.isWeak
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              SRS {w.srsLevel}단계 {w.srsLevel === 5 && '• 마스터'}
                              {w.isWeak && ' • 취약'}
                            </span>
                          </div>

                          {/* 핵심 뜻 */}
                          <p className="text-sm font-bold text-indigo-600/90 pl-0.5">
                            {w.meaning}
                          </p>
                        </div>

                        {/* 액션 버튼 (수정, 단일 삭제) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingWord(w)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="단어 수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`'${w.word}' 단어를 삭제하시겠습니까?`)) {
                                onDeleteWord(w.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="단어 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 예문 확인 아코디언 */}
                      {w.examples && w.examples.length > 0 && (
                        <div className="border-t border-slate-100 pt-2 mt-2">
                          <button
                            onClick={() => toggleExpand(w.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
                          >
                            <span>예문 ({w.examples.length}개)</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {w.examples.map((ex, idx) => (
                                <div
                                  key={ex.id || idx}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <span className="text-indigo-600">#{idx + 1}</span>
                                    {ex.year && (
                                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                        {ex.year}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-800 font-serif leading-relaxed">
                                    {renderHighlightedSentence(ex.sentence, w.word)}
                                  </p>
                                  {ex.translation && (
                                    <p className="text-slate-500 font-sans pt-1 border-t border-slate-200/60">
                                      {ex.translation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
