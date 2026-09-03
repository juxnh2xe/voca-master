import React, { useState, useMemo } from 'react';
import { Sparkles, Check, Layers, AlertCircle, Copy, Folder as FolderIcon, Trash2 } from 'lucide-react';
import { parseAiText, convertParsedToWord } from '../../services/parser';
import { Word, Folder } from '../../types/voca';
import { AiPromptModal } from './AiPromptModal';
import { PdfUploader } from './PdfUploader';

interface AiBatchPasteProps {
  onSaveWords: (words: Word[]) => Promise<void>;
  folders: Folder[];
  currentFolderId: string | null;
}

export const AiBatchPaste: React.FC<AiBatchPasteProps> = ({
  onSaveWords,
  folders,
  currentFolderId,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 실시간 정규식 파싱 및 미리보기
  const parsedWords = useMemo(() => {
    return parseAiText(inputText);
  }, [inputText]);

  const handleSaveAll = async () => {
    if (parsedWords.length === 0) return;
    setIsSaving(true);
    try {
      const wordsToSave: Word[] = parsedWords.map((item) =>
        convertParsedToWord(item, selectedFolderId)
      );
      await onSaveWords(wordsToSave);
      setSaveSuccess(true);
      setInputText('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />

      {/* 5. 브라우저 PDF 직접 텍스트 추출기 */}
      <PdfUploader onTextExtracted={(text) => setInputText(text)} />

      {/* 3 & 4. 텍스트 일괄 붙여넣기 에어리어 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI 정리본 1초 텍스트 일괄 붙여넣기 및 자동 파싱
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ChatGPT 또는 Claude가 표준 서식에 맞춰 생성한 텍스트를 그대로 붙여넣으세요.
            </p>
          </div>

          {/* 4. AI 프롬프트 원클릭 템플릿 복사 버튼 */}
          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI 프롬프트 복사</span>
          </button>
        </div>

        {/* 폴더 선택 */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <FolderIcon className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>저장할 단어장 폴더:</span>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">(최상위) 전체 단어장</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* 텍스트 입력창 */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            placeholder={`#001 단어 세트: 태도 혼동 어휘\n- 단어: attitude\n- 뜻: 태도, 자세\n- 예문: [24.11] A positive attitude leads to success.\n- 해석: 긍정적인 태도는 성공으로 이어진다.\n\n- 단어: altitude\n- 뜻: 고도, 해발`}
            className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-relaxed"
          />

          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-200/80 text-slate-600 hover:bg-slate-300 transition-colors"
              title="지우기"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 하단 저장 바 */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-semibold text-slate-600">
            {parsedWords.length > 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ <strong>{parsedWords.length}개</strong> 단어 자동 인식 완료
              </span>
            ) : (
              <span className="text-slate-400">텍스트를 붙여넣으면 실시간으로 분석됩니다.</span>
            )}
          </div>

          <button
            onClick={handleSaveAll}
            disabled={parsedWords.length === 0 || isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
              parsedWords.length > 0 && !isSaving
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : `[일괄 저장] ${parsedWords.length}개 단어 등록`}</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>단어들이 데이터베이스에 1초 만에 성공적으로 저장되었습니다!</span>
          </div>
        )}
      </div>

      {/* 실시간 파싱 미리보기 카드 목록 */}
      {parsedWords.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            실시간 인식 미리보기 ({parsedWords.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parsedWords.map((item, idx) => (
              <div
                key={item.tempId || idx}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.setId && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Layers className="w-3 h-3" />
                        {item.setId}
                      </span>
                    )}
                    <span className="text-sm font-extrabold text-slate-900">{item.word}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    예문 {item.examples.length}개
                  </span>
                </div>

                <p className="text-xs font-semibold text-indigo-600">{item.meaning}</p>

                {item.examples.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      {item.examples[0].year && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          {item.examples[0].year}
                        </span>
                      )}
                      <span className="truncate">{item.examples[0].sentence}</span>
                    </div>
                    {item.examples[0].translation && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.examples[0].translation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
