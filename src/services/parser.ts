import { Word, Example } from '../types/voca';
import { getTodayStr } from './srs';

export const AI_PROMPT_TEMPLATE = `너는 수능 및 내신 영어 어휘 전문 데이터 분석가야.
아래에 제공하는 단어장 텍스트(또는 단어 목록)를 분석하여, 수능 연계 암기에 최적화된 [표준 서식] 그대로 정제해 줘.

[작성 규칙]
1. 철자가 비슷하여 헷갈리거나(예: attitude, altitude, latitude), 어근상 묶어서 외우면 효과적인 어휘들을 #001, #002, #003 세트로 분류해.
2. 각 단어마다 표제어, 정확하고 명료한 한국어 핵심 뜻, 기출 예문, 한국어 해석을 작성해.

★ [매우 중요 - 예문 내 표제어 일치 규칙]:
- 예문 속에는 반드시 등록하는 **표제어 원형(또는 단순 복수형 -s/es, 과거형 -ed 등 기본 굴절형)이 독립된 단어로 완벽히 식별되도록 포함**되어야 해.
- 접두사나 복합어가 결합된 파생어(예: 표제어가 'latitude'인데 예문에 'midlatitude'를 쓰거나, 표제어가 'access'인데 'inaccessible'을 쓰는 등)로 대체하지 마. 반드시 독립된 표제어 단어(예: latitude, latitudes) 자체를 문장에 사용해야 빈칸 퀴즈에서 완벽하게 인식돼.
- 수능/모의고사 기출 문장이 있다면 출제 연도를 [24.11], [18.06] 형태로 예문 앞에 명시해.

3. 불필요한 설명, 인사말, 마크다운 코드블록(\`\`\`) 없이 아래 [표준 서식] 본문만 바로 출력해.

[표준 서식]
#001 단어 세트: 태도 및 공간 혼동 어휘
- 단어: attitude
- 뜻: 태도, 자세, 사고방식
- 예문: [24.11] A resilient attitude is crucial when overcoming unexpected setbacks.
- 해석: 예기치 못한 좌절을 극복할 때 회복력 있는 태도는 매우 중요하다.

- 단어: altitude
- 뜻: 고도, 해발, 높은 곳
- 예문: [21.06] At high altitudes, oxygen levels drop significantly.
- 해석: 높은 고도에서는 산소 수치가 현저하게 떨어진다.

- 단어: latitude
- 뜻: 위도, (행동/견해의) 자유 허용 범위
- 예문: [19.09] The contract gives the manager wide latitude in decision making.
- 해석: 그 계약서는 매니저에게 의사 결정에 있어 넓은 재량권을 부여한다.

---
변환할 단어장 텍스트:
`;

export interface ParsedWordPreview {
  tempId: string;
  word: string;
  meaning: string;
  setId?: string;
  setName?: string;
  examples: Array<{
    year?: string;
    sentence: string;
    translation: string;
  }>;
}

export const parseAiText = (text: string): ParsedWordPreview[] => {
  if (!text || !text.trim()) return [];

  const results: ParsedWordPreview[] = [];
  const lines = text.split('\n');

  let currentSetId = '';
  let currentSetName = '';
  let currentWord: ParsedWordPreview | null = null;
  let currentExample: { year?: string; sentence: string; translation: string } | null = null;

  const finishCurrentWord = () => {
    if (currentWord && currentWord.word.trim()) {
      if (currentExample && currentExample.sentence.trim()) {
        currentWord.examples.push(currentExample);
        currentExample = null;
      }
      results.push(currentWord);
      currentWord = null;
    }
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Check Set Header: e.g. "#001 단어 세트: 혼동 어휘" or "#01 세트"
    const setMatch = line.match(/^#(\d+)\s*(?:단어\s*세트|세트)?(?::\s*(.*))?/i);
    if (setMatch) {
      finishCurrentWord();
      const num = setMatch[1].padStart(3, '0');
      currentSetId = `#${num}`;
      currentSetName = setMatch[2] ? setMatch[2].trim() : '';
      continue;
    }

    // 2. Check Word Line: e.g. "- 단어: attitude" or "단어: attitude" or "1. 단어: attitude"
    const wordMatch = line.match(/^(?:[-*•]|\d+\.)?\s*(?:단어|Word)\s*:\s*(.+)$/i);
    if (wordMatch) {
      finishCurrentWord();
      currentWord = {
        tempId: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        word: wordMatch[1].trim(),
        meaning: '',
        setId: currentSetId || undefined,
        setName: currentSetName || undefined,
        examples: [],
      };
      continue;
    }

    // 3. Check Meaning Line: e.g. "- 뜻: 태도, 자세" or "뜻: 태도"
    const meaningMatch = line.match(/^(?:[-*•])?\s*(?:뜻|Meaning)\s*:\s*(.+)$/i);
    if (meaningMatch && currentWord) {
      currentWord.meaning = meaningMatch[1].trim();
      continue;
    }

    // 4. Check Example Line: e.g. "- 예문: [24.11] His attitude was great." or "- 예문: The attitude..."
    const exampleMatch = line.match(/^(?:[-*•]|\d+\.)?\s*(?:예문|Example)\s*:\s*(.+)$/i);
    if (exampleMatch && currentWord) {
      if (currentExample && currentExample.sentence.trim()) {
        currentWord.examples.push(currentExample);
      }
      const fullExampleStr = exampleMatch[1].trim();
      
      // Extract [year] if exists: e.g. [24.11], [18.06 수능]
      const yearMatch = fullExampleStr.match(/^\[([^\]]+)\]\s*(.+)$/);
      if (yearMatch) {
        currentExample = {
          year: yearMatch[1].trim(),
          sentence: yearMatch[2].trim(),
          translation: '',
        };
      } else {
        currentExample = {
          sentence: fullExampleStr,
          translation: '',
        };
      }
      continue;
    }

    // 5. Check Translation Line: e.g. "- 해석: 배움에 대한 그의 태도는..."
    const transMatch = line.match(/^(?:[-*•])?\s*(?:해석|번역|Translation)\s*:\s*(.+)$/i);
    if (transMatch) {
      if (currentExample) {
        currentExample.translation = transMatch[1].trim();
      } else if (currentWord && currentWord.examples.length > 0) {
        currentWord.examples[currentWord.examples.length - 1].translation = transMatch[1].trim();
      }
      continue;
    }
  }

  finishCurrentWord();
  return results;
};

export const convertParsedToWord = (
  item: ParsedWordPreview,
  folderId: string | null = null
): Word => {
  const today = getTodayStr();
  return {
    id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    word: item.word,
    meaning: item.meaning,
    setId: item.setId,
    setName: item.setName,
    folderId,
    examples: item.examples.map((ex, idx) => ({
      id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      year: ex.year,
      sentence: ex.sentence,
      translation: ex.translation,
    })),
    srsLevel: 0,
    nextReviewDate: today,
    consecutiveCorrect: 0,
    isWeak: false,
    totalReviews: 0,
    totalCorrect: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
