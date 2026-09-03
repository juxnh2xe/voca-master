import React, { useState } from 'react';
import { Folder as FolderIcon, Target, Layers, Play, BookOpen, SlidersHorizontal, Hash } from 'lucide-react';
import { Folder } from '../../types/voca';
import { SetRangeGroup, SingleSetItem, formatSetId } from '../../hooks/useWords';

interface StudySetupProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  setGroups: SetRangeGroup[];
  individualSets: SingleSetItem[];
  selectedRange: string | null;
  onSelectRange: (range: string | null) => void;
  targetWordCount: number;
  onStartStudy: () => void;
}

export const StudySetup: React.FC<StudySetupProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  setGroups,
  individualSets,
  selectedRange,
  onSelectRange,
  targetWordCount,
  onStartStudy,
}) => {
  // 범위 선택 모드: 'bundle' (5세트 묶음 - 추천), 'single' (개별 세트), 'custom' (직접 범위 지정)
  const [rangeMode, setRangeMode] = useState<'bundle' | 'single' | 'custom'>('bundle');

  // 직접 범위 지정 상태 (시작 세트, 종료 세트)
  const minSetNum = individualSets.length > 0 ? individualSets[0].num : 1;
  const maxSetNum = individualSets.length > 0 ? individualSets[individualSets.length - 1].num : 1;

  const [customStart, setCustomStart] = useState<number>(minSetNum);
  const [customEnd, setCustomEnd] = useState<number>(Math.min(minSetNum + 4, maxSetNum));

  const applyCustomRange = () => {
    const start = Math.min(customStart, customEnd);
    const end = Math.max(customStart, customEnd);
    onSelectRange(`${formatSetId(start)} ~ ${formatSetId(end)}`);
  };

  const hasSets = individualSets.length > 0;

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-6 space-y-6">
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        {/* 헤더 */}
        <div className="text-center space-y-1 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">단어 암기</h2>
          <p className="text-xs text-slate-500">
            학습할 단어장과 세트 범위를 선택하고 암기를 시작하세요.
          </p>
        </div>

        {/* 1. 단어장(폴더) 선택 */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <FolderIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>단어장 선택</span>
          </label>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => onSelectFolder(e.target.value || null)}
            className="w-full text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="">전체 단어장</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. 학습 범위 선택 (세트 단위) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Target className="w-3.5 h-3.5 text-rose-500" />
              <span>학습 세트 범위 선택</span>
            </div>

            {hasSets && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setRangeMode('bundle')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rangeMode === 'bundle'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  5세트 묶음
                </button>
                <button
                  onClick={() => setRangeMode('single')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rangeMode === 'single'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  개별 세트
                </button>
                <button
                  onClick={() => setRangeMode('custom')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rangeMode === 'custom'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  직접 지정
                </button>
              </div>
            )}
          </div>

          {/* 전체 범위 선택 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectRange(null)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedRange === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>전체 세트 학습</span>
            </button>

            {selectedRange && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                선택됨: {selectedRange}
              </span>
            )}
          </div>

          {/* [모드 1]: 5세트 단위 묶음 버튼 (#001 ~ #005 등) */}
          {rangeMode === 'bundle' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {setGroups.map((group) => {
                  const isSelected = selectedRange === group.label;
                  return (
                    <button
                      key={group.label}
                      onClick={() => onSelectRange(group.label)}
                      className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs ring-1 ring-indigo-300 font-bold'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold tracking-tight">
                        {group.label}
                      </span>
                      <span className={`text-[11px] mt-1 ${isSelected ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                        {group.count}개 단어
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* [모드 2]: 개별 세트 단위 버튼 (#001, #002 등) */}
          {rangeMode === 'single' && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {individualSets.map((s) => {
                  const isSelected = selectedRange === s.setId;
                  return (
                    <button
                      key={s.setId}
                      onClick={() => onSelectRange(s.setId)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-2xs font-bold'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{s.setId}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{s.count}단어</span>
                      </div>
                      {s.setName && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {s.setName}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* [모드 3]: 직접 범위 지정 (시작 세트 ~ 종료 세트) */}
          {rangeMode === 'custom' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>시작 세트와 종료 세트를 선택하세요</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">시작 세트</label>
                  <select
                    value={customStart}
                    onChange={(e) => setCustomStart(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800"
                  >
                    {individualSets.map((s) => (
                      <option key={s.setId} value={s.num}>
                        {s.setId} {s.setName ? `(${s.setName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold mt-4">~</span>

                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">종료 세트</label>
                  <select
                    value={customEnd}
                    onChange={(e) => setCustomEnd(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800"
                  >
                    {individualSets.map((s) => (
                      <option key={s.setId} value={s.num}>
                        {s.setId} {s.setName ? `(${s.setName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={applyCustomRange}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all"
              >
                {formatSetId(Math.min(customStart, customEnd))} ~ {formatSetId(Math.max(customStart, customEnd))} 범위 적용하기
              </button>
            </div>
          )}
        </div>

        {/* 요약 및 시작 버튼 */}
        <div className="pt-2 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between px-5">
            <div>
              <span className="text-xs text-slate-500">선택된 학습 범위</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">
                {selectedRange || '전체 단어'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">학습 단어 수</span>
              <p className="text-xl font-black text-indigo-600">
                {targetWordCount}
                <span className="text-xs font-medium text-slate-500 ml-1">단어</span>
              </p>
            </div>
          </div>

          <button
            onClick={onStartStudy}
            disabled={targetWordCount === 0}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              targetWordCount > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>학습 시작하기 ({targetWordCount}단어)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
