import React, { useState } from 'react';
import { Plus, Trash2, Check, BookOpen, Layers, Folder as FolderIcon } from 'lucide-react';
import { Word, Folder, Example } from '../../types/voca';
import { getTodayStr } from '../../services/srs';

interface SingleWordFormProps {
  onSaveWord: (word: Word) => Promise<void>;
  folders: Folder[];
  currentFolderId: string | null;
}

export const SingleWordForm: React.FC<SingleWordFormProps> = ({
  onSaveWord,
  folders,
  currentFolderId,
}) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [setId, setSetId] = useState('');
  const [setName, setSetName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [examples, setExamples] = useState<Array<{ id: string; year: string; sentence: string; translation: string }>>([
    { id: '1', year: '', sentence: '', translation: '' },
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAddExample = () => {
    setExamples((prev) => [
      ...prev,
      { id: String(Date.now()), year: '', sentence: '', translation: '' },
    ]);
  };

  const handleRemoveExample = (id: string) => {
    setExamples((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleExampleChange = (id: string, field: 'year' | 'sentence' | 'translation', val: string) => {
    setExamples((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: val } : ex))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      alert('단어와 뜻을 입력해 주세요.');
      return;
    }

    const today = getTodayStr();
    const formattedExamples: Example[] = examples
      .filter((ex) => ex.sentence.trim())
      .map((ex, idx) => ({
        id: `ex_${Date.now()}_${idx}`,
        year: ex.year.trim() || undefined,
        sentence: ex.sentence.trim(),
        translation: ex.translation.trim(),
      }));

    const newWord: Word = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      word: word.trim(),
      meaning: meaning.trim(),
      setId: setId.trim() ? (setId.startsWith('#') ? setId.trim() : `#${setId.trim()}`) : undefined,
      setName: setName.trim() || undefined,
      folderId: selectedFolderId,
      examples: formattedExamples,
      srsLevel: 0,
      nextReviewDate: today,
      consecutiveCorrect: 0,
      isWeak: false,
      totalReviews: 0,
      totalCorrect: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveWord(newWord);
    setStatusMessage(`'${newWord.word}' 단어가 성공적으로 등록되었습니다!`);

    // Reset form
    setWord('');
    setMeaning('');
    setExamples([{ id: '1', year: '', sentence: '', translation: '' }]);

    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          단일 단어 수동 등록 및 다중 예문 지원
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          표제어와 뜻, 그리고 수능/모의고사 기출 예문들을 무제한으로 꼼꼼하게 등록합니다.
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            표제어 (English Word) *
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
            placeholder="예: attitude"
            className="w-full text-base font-bold px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            핵심 한국어 뜻 *
          </label>
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            required
            placeholder="예: 태도, 자세, 사고방식"
            className="w-full text-base px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* 연관 세트 정보 (선택) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            연관 어휘 세트 번호 (선택)
          </label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-sm font-bold">
              #
            </span>
            <input
              type="text"
              value={setId.replace(/^#/, '')}
              onChange={(e) => setSetId(e.target.value)}
              placeholder="001"
              className="w-full text-sm font-bold px-3 py-2.5 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 소속 단어장 폴더 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            소속 단어장 (폴더)
          </label>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
          >
            <option value="">(최상위) 전체 단어장</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 다중 기출 예문 영역 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span>기출 예문 및 해석 (다중 등록 지원)</span>
          <span className="text-slate-400">예문 없이 단어만 등록해도 무방합니다.</span>
        </div>

        {examples.map((ex, idx) => (
          <div
            key={ex.id}
            className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                예문 {idx + 1}
              </span>
              {examples.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveExample(ex.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                  title="예문 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-1">
                <input
                  type="text"
                  value={ex.year}
                  onChange={(e) => handleExampleChange(ex.id, 'year', e.target.value)}
                  placeholder="출제연도 (24.11)"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={ex.sentence}
                  onChange={(e) => handleExampleChange(ex.id, 'sentence', e.target.value)}
                  placeholder="영어 기출 예문 본문"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <input
              type="text"
              value={ex.translation}
              onChange={(e) => handleExampleChange(ex.id, 'translation', e.target.value)}
              placeholder="예문 한국어 번역 해석"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddExample}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ 추가 기출 예문 작성</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 제출 */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>단어 등록 완료</span>
        </button>
      </div>
    </form>
  );
};
