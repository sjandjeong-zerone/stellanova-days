// LLM-based summarization via OpenRouter (DeepSeek)

interface SummarizeInput {
  rawContent?: string;
  meetingNotes?: string;
  date: string;
}

const NAME_NORMALIZE: Record<string, string> = {
  형: "이석진",
  나: "이석진",
};

function normalizeName(name: string): string {
  return NAME_NORMALIZE[name.trim()] || name.trim();
}

export async function llmSummarize({ rawContent, meetingNotes, date }: SummarizeInput): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const parts: string[] = [];
  if (rawContent?.trim()) parts.push(`[카카오톡 대화]\n${rawContent.trim()}`);
  if (meetingNotes?.trim()) parts.push(`[회의록]\n${meetingNotes.trim()}`);
  if (parts.length === 0) return null;

  const source = parts.join("\n\n").slice(0, 12000);

  const prompt = `아래는 ${date}에 오간 StellaNova(주얼리 브랜드) 팀의 카카오톡 대화 및 회의록입니다. 이를 깔끔한 업무 일지 요약으로 정리해주세요.

## 요약 규칙
1. **3~5문장의 서술형 요약**을 먼저 작성 (핵심 논의와 결정 사항 중심)
2. 그 아래 **주요 논의/결정 사항**을 불릿(•)으로 3~6개 정리
3. "사진", "이모티콘", "보이스톡" 같은 미디어 표시는 무시
4. 참여자 이름은 그대로 사용 (예: 이연희 상무, 박윤정, 이석진)
5. 사실만 기반으로 작성하고, 추측하거나 없는 내용을 만들지 말 것
6. 마크다운 헤더(#) 없이 일반 텍스트와 불릿만 사용

## 원본 내용
${source}

## 요약`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch {
    return null;
  }
}
