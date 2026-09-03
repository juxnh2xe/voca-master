import React, { useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractTextFromPdf, PdfExtractionProgress } from '../../services/pdfExtractor';

interface PdfUploaderProps {
  onTextExtracted: (extractedText: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PdfExtractionProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMessage('PDF 파일만 업로드 가능합니다.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(`PDF 텍스트 분석을 시작합니다... (${file.name})`);

    try {
      const extractedText = await extractTextFromPdf(file, (p) => {
        setProgress(p);
        setStatusMessage(`브라우저 내부 파싱 진행 중: ${p.currentPage} / ${p.totalPages} 페이지 완료`);
      });

      if (!extractedText.trim()) {
        throw new Error('PDF에서 텍스트를 추출할 수 없습니다. (스캔된 이미지 전용 PDF일 수 있습니다)');
      }

      setStatusMessage(`성공적으로 ${extractedText.length.toLocaleString()}자의 텍스트를 추출하여 입력창에 반영했습니다!`);
      onTextExtracted(extractedText);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'PDF 파싱 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <FileUp className="w-4 h-4 text-indigo-600" />
            PDF 단어장 파일 브라우저 직접 텍스트 추출
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            외부 서버 전송 없이 브라우저 메모리 상에서 안전하고 빠르게 본문 텍스트를 읽어옵니다.
          </p>
        </div>

        <label className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isProcessing
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
        }`}>
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{progress ? `${progress.currentPage}/${progress.totalPages}P 추출 중` : '분석 중...'}</span>
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" />
              <span>PDF 파일 선택</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
          />
        </label>
      </div>

      {/* 상태 및 피드백 메시지 */}
      {statusMessage && !errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
