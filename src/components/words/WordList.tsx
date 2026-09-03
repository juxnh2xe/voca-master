import React, { useState } from 'react';
import { Search, Sparkles, Layers, Folder as FolderIcon, Edit3, Trash2, CheckCircle, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
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
}) => {
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [expandedWordIds, setExpandedWordIds] = useState<Set<string>>(new Set());

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

  const tabs: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'all', label: '전체' },
    { id: 'learning', label: '학습 중 (Lv 1~4)' },
    { id: 'mastered', label: '완전 정복 (Lv 5)' },
    { id: 'weak', label: '취약 단어' },
    { id: 'today', label: '오늘 복습' },
  ];

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

      {/* 단어 목록 결과 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
          <span>검색 및 필터 결과: {words.length}개</span>
          <span>세트 순 정렬</span>
        </div>

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

              return (
                <div
                  key={w.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {w.setId && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Layers className="w-3 h-3" />
                            {w.setId}
                          </span>
                        )}

                        <span className="text-lg font-black text-slate-900 font-serif">
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

                    {/* 액션 버튼 (수정, 삭제) */}
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
                    <div className="border-t border-slate-100 pt-2">
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
                                  <span className="px-1.5 py-0.2 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px]">
                                    {ex.year} 기출
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 font-serif">
                                {renderHighlightedSentence(ex.sentence, w.word)}
                              </p>
                              {ex.translation && (
                                <p className="text-slate-500 font-sans">{ex.translation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
