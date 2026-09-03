import React from 'react';
import { Folder as FolderIcon, Target, Layers, Play, BookOpen } from 'lucide-react';
import { Folder } from '../../types/voca';

interface StudySetupProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  ranges: string[];
  selectedRange: string | null;
  onSelectRange: (range: string | null) => void;
  targetWordCount: number;
  onStartStudy: () => void;
}

export const StudySetup: React.FC<StudySetupProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  ranges,
  selectedRange,
  onSelectRange,
  targetWordCount,
  onStartStudy,
}) => {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">단어 암기</h2>
          <p className="text-xs text-slate-500">
            학습할 단어장과 범위를 선택한 후 암기를 시작하세요.
          </p>
        </div>

        {/* 1. 단어장(폴더) 선택 */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <FolderIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>단어장 선택</span>
          </label>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => onSelectFolder(e.target.value || null)}
            className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">전체 단어장</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. 학습 범위 선택 (20단어 단위 버튼) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              학습 범위 선택
            </span>
            <span className="text-[11px] text-slate-400 font-normal">20단어 단위</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectRange(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedRange === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              전체
            </button>

            {ranges.map((range) => {
              const isSelected = selectedRange === range;
              return (
                <button
                  key={range}
                  onClick={() => onSelectRange(range)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>

        {/* 요약 및 시작 버튼 */}
        <div className="pt-2 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs text-slate-500">학습 예정 단어 수</span>
            <p className="text-2xl font-bold text-indigo-600 mt-0.5">
              {targetWordCount}
              <span className="text-sm font-normal text-slate-500 ml-1">단어</span>
            </p>
          </div>

          <button
            onClick={onStartStudy}
            disabled={targetWordCount === 0}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              targetWordCount > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>학습 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
