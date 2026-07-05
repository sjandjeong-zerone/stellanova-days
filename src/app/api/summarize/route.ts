import { NextRequest, NextResponse } from "next/server";

// Generate a narrative-style summary from raw content
function generateNarrativeSummary(
  rawContent?: string,
  meetingNotes?: string
): string {
  const sources: string[] = [];

  if (rawContent?.trim()) {
    const lines = rawContent.split("\n").filter((l) => l.trim());
    const speakers = new Set<string>();
    const topics: string[] = [];
    let messageCount = 0;

    for (const line of lines) {
      // Extract speaker: "이름:" or "이름 님:" pattern
      const speakerMatch = line.match(
        /(?:^|\]\s*|,\s*)([가-힣a-zA-Z]+)(?:\s*(?:상무|님|대표|팀장|사원))?\s*:/
      );
      if (speakerMatch) {
        speakers.add(speakerMatch[1]);
        messageCount++;
        // Extract key topic keywords
        const content = line.split(":").slice(1).join(":").trim();
        if (content) {
          const keywords = extractKeywords(content);
          topics.push(...keywords);
        }
      }
    }

    if (messageCount > 0) {
      const speakerList = [...speakers];
      const mainTopics = [...new Set(topics)].slice(0, 3);

      let narrative = `${speakerList.join(", ")} 등 ${speakerList.length}명이 대화를 나누었습니다. `;

      if (mainTopics.length > 0) {
        narrative += `주요 주제는 ${mainTopics.join(", ")} 등이었으며, `;
      }

      narrative += `총 ${messageCount}개의 메시지가 오갔습니다.`;

      // Add context from the actual messages
      const significantLines = lines
        .filter(
          (l) =>
            l.includes(":") &&
            !l.includes("이모티콘") &&
            l.split(":")[1]?.trim().length > 10
        )
        .slice(0, 3);

      if (significantLines.length > 0) {
        narrative += "\n\n주요 대화:\n";
        significantLines.forEach((line) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            const speaker = parts[0].replace(/^.*?(?:,\s*|\]\s*)/, "").trim();
            const msg = parts.slice(1).join(":").trim().slice(0, 120);
            narrative += `• ${speaker}: ${msg}\n`;
          }
        });
      }

      sources.push(narrative);
    }
  }

  if (meetingNotes?.trim()) {
    const notes = meetingNotes;
    // Extract meeting structure
    const attendees = notes.match(/참석자[:\s]*([^\n]+)/);
    const decisions = notes.match(/결정\s*사항[:\s]*([\s\S]*?)(?=##|$)/);
    const agenda = notes.match(/논의\s*사항[:\s]*([\s\S]*?)(?=##|$)/);

    let meetingSummary = "회의가 진행되었습니다.";

    if (attendees) {
      meetingSummary = `${attendees[1].trim()}이(가) 참석한 회의에서 `;
    }

    if (agenda) {
      const items = agenda[1].split("\n").filter((l) => l.trim().startsWith("-") || l.trim().match(/^\d/));
      if (items.length > 0) {
        meetingSummary += `${items.length}건의 안건을 논의했습니다.`;
      }
    }

    if (decisions) {
      const items = decisions[1].split("\n").filter((l) => l.trim().startsWith("-") || l.trim().match(/^\d/));
      if (items.length > 0) {
        meetingSummary += `\n\n주요 결정 사항:`;
        items.slice(0, 3).forEach((item) => {
          meetingSummary += `\n• ${item.replace(/^[-*\d.]\s*/, "").trim().slice(0, 100)}`;
        });
      }
    }

    sources.push(meetingSummary);
  }

  if (sources.length === 0) {
    return "이 날의 활동 기록입니다.";
  }

  return sources.join("\n\n");
}

function extractKeywords(text: string): string[] {
  const keywordMap: Record<string, string> = {
    배송: "배송",
    발렉스: "발렉스 물류",
    주문: "주문",
    제품: "제품",
    가격: "가격",
    마케팅: "마케팅",
    계약: "계약",
    출시: "출시",
    고객: "고객",
    카페24: "카페24",
    쇼핑몰: "쇼핑몰",
    전략: "전략",
    브랜드: "브랜드",
    사진: "제품 사진",
    촬영: "촬영",
  };

  const found: string[] = [];
  for (const [key, label] of Object.entries(keywordMap)) {
    if (text.includes(key)) found.push(label);
  }
  return found;
}

export async function POST(request: NextRequest) {
  const { raw_content, meeting_notes } = await request.json();

  const summary = generateNarrativeSummary(raw_content, meeting_notes);

  return NextResponse.json({ summary });
}