import * as pdfjsLib from 'pdfjs-dist';

// pdfjs worker 설정: 브라우저 환경에서 CDN 또는 번들러 worker 로드
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfExtractionProgress {
  currentPage: number;
  totalPages: number;
}

export const extractTextFromPdf = async (
  file: File,
  onProgress?: (progress: PdfExtractionProgress) => void
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({ currentPage: pageNum, totalPages });
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // 페이지 텍스트 조립
    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items as any[]) {
      if ('str' in item) {
        // Y좌표 변화가 크면 줄바꿈 처리
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
    }

    fullText += pageText + '\n\n';
  }

  return fullText.trim();
};
