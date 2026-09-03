import React, { useState } from 'react';
import { Layers, Plus, Trash2, Check, Sparkles, Folder as FolderIcon } from 'lucide-react';
import { Word, Folder } from '../../types/voca';
import { getTodayStr } from '../../services/srs';

interface BundleWordFormProps {
  onSaveWords: (words: Word[]) => Promise<void>;
  folders: Folder[];
  currentFolderId: string | null;
}

interface BundleRow {
  id: string;
  word: string;
  meaning: string;
  exampleSentence?: string;
  exampleYear?: string;
  exampleTranslation?: string;
}

export const BundleWordForm: React.FC<BundleWordFormProps> = ({
  onSaveWords,
  folders,
  currentFolderId,
}) => {
  const [setNumber, setSetNumber] = useState('001');
  const [setName, setSetName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [autoIncrement, setAutoIncrement] = useState(true);
  const [rows, setRows] = useState<BundleRow[]>([
    { id: '1', word: '', meaning: '' },
    { id: '2', word: '', meaning: '' },
    { id: '3', word: '', meaning: '' },
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: String(Date.now()), word: '', meaning: '' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof BundleRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.word.trim() && r.meaning.trim());
    if (validRows.length === 0) {
      alert('최소 1개 이상의 단어와 뜻을 입력해 주세요.');
      return;
    }

    const today = getTodayStr();
    const formattedSetId = `#${setNumber.trim().padStart(3, '0')}`;

    const newWords: Word[] = validRows.map((r, index) => {
      const examples = [];
      if (r.exampleSentence && r.exampleSentence.trim()) {
        examples.push({
          id: `ex_${Date.now()}_${index}`,
          year: r.exampleYear?.trim() || undefined,
          sentence: r.exampleSentence.trim(),
          translation: r.exampleTranslation?.trim() || '',
        });
      }

      return {
        id: `w_bun_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        word: r.word.trim(),
        meaning: r.meaning.trim(),
        setId: formattedSetId,
        setName: setName.trim() || undefined,
        orderInSet: index + 1,
        folderId: selectedFolderId,
        examples,
        srsLevel: 0,
        nextReviewDate: today,
        consecutiveCorrect: 0,
        isWeak: false,
        totalReviews: 0,
        totalCorrect: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    await onSaveWords(newWords);
    setStatusMessage(`${formattedSetId} 세트 (${newWords.length}단어)가 성공적으로 저장되었습니다!`);

    // 6. [연속 저장] 옵션 활성화 시 세트 번호 자동 증가 및 입력창 초기화
    if (autoIncrement) {
      const currentNum = parseInt(setNumber, 10);
      const nextNum = isNaN(currentNum) ? 1 : currentNum + 1;
      setSetNumber(String(nextNum).padStart(3, '0'));
      setSetName('');
      setRows([
        { id: '1', word: '', meaning: '' },
        { id: '2', word: '', meaning: '' },
        { id: '3', word: '', meaning: '' },
      ]);
    }

    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            연관 단어 세트 묶음 수동 연속 등록 (Bundle Mode)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            철자나 의미가 연결된 혼동 어휘들을 한자리에서 세트로 등록합니다.
          </p>
        </div>

        {/* 연속 저장 토글 */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoIncrement}
            onChange={(e) => setAutoIncrement(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-xs font-bold text-indigo-900">
            [연속 저장] 번호 자동 증가
          </span>
        </label>
      </div>

      {/* 세트 정보 설정 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            세트 번호 (Set #)
          </label>
          <div className="flex items-center">
            <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-sm font-bold">
              #
            </span>
            <input
              type="text"
              value={setNumber}
              onChange={(e) => setSetNumber(e.target.value)}
              required
              className="w-full text-sm font-bold px-3 py-2 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="001"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            세트 테마 명칭 (선택)
          </label>
          <input
            type="text"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="예: 태도·고도·위도 혼동 어휘"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            소속 폴더
          </label>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
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

      {/* 단어 행 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>세트 내 연관 단어 목록</span>
          <span>{rows.length}개 항목</span>
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </span>

              <input
                type="text"
                value={row.word}
                onChange={(e) => handleRowChange(row.id, 'word', e.target.value)}
                placeholder="영단어 (예: attitude)"
                className="w-1/3 text-sm font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />

              <input
                type="text"
                value={row.meaning}
                onChange={(e) => handleRowChange(row.id, 'meaning', e.target.value)}
                placeholder="한국어 뜻 (예: 태도, 자세)"
                className="flex-1 text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                disabled={rows.length <= 1}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* 선택적 기출 예문 간이 입력 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <input
                type="text"
                value={row.exampleYear || ''}
                onChange={(e) => handleRowChange(row.id, 'exampleYear', e.target.value)}
                placeholder="연도 (24.11)"
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono"
              />
              <input
                type="text"
                value={row.exampleSentence || ''}
                onChange={(e) => handleRowChange(row.id, 'exampleSentence', e.target.value)}
                placeholder="기출 예문 (선택)"
                className="sm:col-span-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700"
              />
              <input
                type="text"
                value={row.exampleTranslation || ''}
                onChange={(e) => handleRowChange(row.id, 'exampleTranslation', e.target.value)}
                placeholder="한국어 해석 (선택)"
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddRow}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ 연관 단어 행 추가</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>현재 세트 저장 {autoIncrement && '(+ 다음 번호 연속 준비)'}</span>
        </button>
      </div>
    </form>
  );
};
