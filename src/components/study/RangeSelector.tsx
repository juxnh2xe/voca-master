import React from 'react';
import { Target, Layers, Folder as FolderIcon } from 'lucide-react';
import { Folder } from '../../types/voca';

interface RangeSelectorProps {
  ranges: string[];
  selectedRange: string | null;
  onSelectRange: (range: string | null) => void;
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  totalWords: number;
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({
  ranges,
  selectedRange,
  onSelectRange,
  folders,
  selectedFolderId,
  onSelectFolder,
  totalWords,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto mb-5 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* 1. 폴더 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <FolderIcon className="w-4 h-4 text-indigo-500" />
          <span>학습 단어장 선택</span>
        </div>
        <select
          value={selectedFolderId || ''}
          onChange={(e) => onSelectFolder(e.target.value || null)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">전체 단어장 ({totalWords}단어)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              📁 {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. 20개 단위 단어 번호 범위 선택 버튼 (#01 ~ #20, #21 ~ #40 등) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <Target className="w-4 h-4 text-rose-500" />
          <span>학습 범위 선택 (20단어 단위)</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectRange(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedRange === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1" />
            전체 범위
          </button>

          {ranges.map((range) => {
            const isSelected = selectedRange === range;
            return (
              <button
                key={range}
                onClick={() => onSelectRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
    </div>
  );
};
