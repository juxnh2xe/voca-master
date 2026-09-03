import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Layers, Folder as FolderIcon } from 'lucide-react';
import { Word, Folder, Example } from '../../types/voca';

interface WordEditModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Word>) => Promise<void>;
  folders: Folder[];
}

export const WordEditModal: React.FC<WordEditModalProps> = ({
  word,
  isOpen,
  onClose,
  onSave,
  folders,
}) => {
  if (!isOpen || !word) return null;

  const [headword, setHeadword] = useState(word.word);
  const [meaning, setMeaning] = useState(word.meaning);
  const [setId, setSetId] = useState(word.setId || '');
  const [setName, setSetName] = useState(word.setName || '');
  const [folderId, setFolderId] = useState<string | null>(word.folderId || null);
  const [srsLevel, setSrsLevel] = useState(word.srsLevel);
  const [examples, setExamples] = useState<Example[]>(word.examples || []);

  const handleAddExample = () => {
    setExamples((prev) => [
      ...prev,
      { id: `ex_${Date.now()}`, year: '', sentence: '', translation: '' },
    ]);
  };

  const handleRemoveExample = (id: string) => {
    setExamples((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleExampleChange = (id: string, field: keyof Example, val: string) => {
    setExamples((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: val } : ex))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(word.id, {
      word: headword.trim(),
      meaning: meaning.trim(),
      setId: setId.trim() ? (setId.startsWith('#') ? setId.trim() : `#${setId.trim()}`) : undefined,
      setName: setName.trim() || undefined,
      folderId,
      srsLevel,
      examples: examples.filter((ex) => ex.sentence.trim()),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">단어 정보 상세 수정</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">표제어</label>
              <input
                type="text"
                value={headword}
                onChange={(e) => setHeadword(e.target.value)}
                required
                className="w-full text-sm font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">한글 뜻</label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                required
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">세트 번호 (선택)</label>
              <input
                type="text"
                value={setId}
                onChange={(e) => setSetId(e.target.value)}
                placeholder="#001"
                className="w-full text-sm font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">소속 폴더</label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">(최상위) 전체 단어장</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SRS 암기 단계 (0~5)</label>
              <select
                value={srsLevel}
                onChange={(e) => setSrsLevel(parseInt(e.target.value, 10))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
              >
                <option value={0}>0단계 (미학습)</option>
                <option value={1}>1단계 (1일 뒤)</option>
                <option value={2}>2단계 (3일 뒤)</option>
                <option value={3}>3단계 (7일 뒤)</option>
                <option value={4}>4단계 (14일 뒤)</option>
                <option value={5}>5단계 (완전 정복 30일)</option>
              </select>
            </div>
          </div>

          {/* 예문 리스트 */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>기출 예문 ({examples.length}개)</span>
              <button
                type="button"
                onClick={handleAddExample}
                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 예문 추가
              </button>
            </div>

            {examples.map((ex, idx) => (
              <div key={ex.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">예문 #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExample(ex.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={ex.year || ''}
                    onChange={(e) => handleExampleChange(ex.id, 'year', e.target.value)}
                    placeholder="연도 (24.11)"
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    value={ex.sentence}
                    onChange={(e) => handleExampleChange(ex.id, 'sentence', e.target.value)}
                    placeholder="영어 예문"
                    className="sm:col-span-3 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <input
                  type="text"
                  value={ex.translation}
                  onChange={(e) => handleExampleChange(ex.id, 'translation', e.target.value)}
                  placeholder="한국어 해석"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>변경사항 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
