import { NextRequest, NextResponse } from "next/server";
import { createEntry, getAllEntries } from "@/lib/db";

// Parse KakaoTalk chat text and group by date
function parseKakaoText(text: string): Map<string, string[]> {
  const byDate = new Map<string, string[]>();
  const lines = text.split("\n");

  const datePattern = /(\d{4})[년.\s]+(\d{1,2})[월.\s]+(\d{1,2})일?/;
  let currentDate = "";

  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, "0");
      const d = match[3].padStart(2, "0");
      currentDate = `${y}-${m}-${d}`;
      if (!byDate.has(currentDate)) {
        byDate.set(currentDate, []);
      }
      const content = line
        .replace(
          /^.*?\d{4}[년.\s]+\d{1,2}[월.\s]+\d{1,2}일?\s*[오전오후]?\s*\d{0,2}:\d{0,2},?\s*/,
          ""
        )
        .trim();
      if (content) {
        byDate.get(currentDate)!.push(content);
      }
    } else if (currentDate && line.trim()) {
      byDate.get(currentDate)!.push(line.trim());
    }
  }

  return byDate;
}

// Simple rule-based title generation
function generateTitle(messages: string[]): string {
  const combined = messages.join(" ");
  const keywords: Record<string, string> = {
    주문: "주문 관련 논의",
    배송: "배송 관련 논의",
    제품: "제품 관련 논의",
    가격: "가격 전략 논의",
    마케팅: "마케팅 전략 논의",
    계약: "계약 관련 논의",
    촬영: "제품 촬영 및 콘텐츠",
    회의: "회의 및 미팅",
    출시: "출시 준비 논의",
    고객: "고객 응대 논의",
    카페24: "카페24 쇼핑몰 논의",
  };
  for (const [key, title] of Object.entries(keywords)) {
    if (combined.includes(key)) return title;
  }
  const firstLine = messages[0]?.replace(/^\[.*?\]\s*/, "").trim();
  if (firstLine && firstLine.length > 5) {
    return firstLine.length > 40 ? firstLine.slice(0, 40) + "..." : firstLine;
  }
  return "일일 대화 기록";
}

// Simple rule-based tag extraction
function extractTags(messages: string[]): string[] {
  const combined = messages.join(" ");
  const tags = new Set<string>();
  const tagMap: Record<string, string> = {
    주문: "주문", 배송: "배송", 발렉스: "발렉스", 제품: "제품",
    가격: "가격", 전략: "전략", 마케팅: "마케팅", 계약: "계약",
    촬영: "제품", 고객: "고객", 카페24: "카페24", 쇼핑몰: "쇼핑몰",
    브랜드: "브랜드", 출시: "출범", 회의: "회의",
  };
  for (const [key, tag] of Object.entries(tagMap)) {
    if (combined.includes(key)) tags.add(tag);
  }
  return [...tags].slice(0, 5);
}

// Name normalization for public summaries
function normalizeName(name: string): string {
  const nameMap: Record<string, string> = {
    형: "이석진",
    나: "이석진",
  };
  return nameMap[name.trim()] || name.trim();
}

// Narrative-style summary generation
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
      const speakerMatch = line.match(
        /(?:^|\]\s*|,\s*)([가-힣a-zA-Z]+)(?:\s*(?:상무|님|대표|팀장|사원))?\s*:/
      );
      if (speakerMatch) {
        const name = normalizeName(speakerMatch[1]);
        speakers.add(name);
        messageCount++;
        const content = line.split(":").slice(1).join(":").trim();
        if (content) {
          const keywordMap: Record<string, string> = {
            배송: "배송", 발렉스: "발렉스 물류", 주문: "주문",
            제품: "제품", 가격: "가격", 마케팅: "마케팅", 계약: "계약",
            출시: "출시", 고객: "고객", 카페24: "카페24",
            쇼핑몰: "쇼핑몰", 전략: "전략",
          };
          for (const [key, label] of Object.entries(keywordMap)) {
            if (content.includes(key)) topics.push(label);
          }
        }
      }
    }

    if (messageCount > 0) {
      const speakerList = [...speakers];
      const mainTopics = [...new Set(topics)].slice(0, 3);

      let narrative = `${speakerList.join(", ")} 등이 대화를 나누었습니다. `;
      if (mainTopics.length > 0) {
        narrative += `주요 내용은 ${mainTopics.join(", ")} 등으로, `;
      }
      narrative += `총 ${messageCount}개의 메시지가 오갔습니다.`;

      const significantLines = lines
        .filter(
          (l) =>
            l.includes(":") &&
            l.split(":")[1]?.trim().length > 10
        )
        .slice(0, 3);

      if (significantLines.length > 0) {
        narrative += "\n\n주요 대화 내용:\n";
        significantLines.forEach((line) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            const rawSpeaker = parts[0].replace(/^.*?(?:,\s*|\]\s*)/, "").trim();
            const speaker = normalizeName(rawSpeaker);
            const msg = parts.slice(1).join(":").trim().slice(0, 120);
            narrative += `• ${speaker}: ${msg}\n`;
          }
        });
      }
      sources.push(narrative);
    }
  }

  if (meetingNotes?.trim()) {
    const attendees = meetingNotes.match(/참석자[:\s]*([^\n]+)/);
    const decisions = meetingNotes.match(
      /결정\s*사항[:\s]*([\s\S]*?)(?=##|$)/
    );

    let meetingSummary = "회의가 진행되었습니다.";
    if (attendees) {
      meetingSummary = `${attendees[1].trim()}이(가) 참석한 회의가 있었습니다. `;
    }
    if (decisions) {
      const items = decisions[1]
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || l.trim().match(/^\d/));
      if (items.length > 0) {
        meetingSummary += `\n\n주요 결정 사항:`;
        items.slice(0, 3).forEach((item) => {
          meetingSummary += `\n• ${item.replace(/^[-*\d.]\s*/, "").trim().slice(0, 100)}`;
        });
      }
    }
    sources.push(meetingSummary);
  }

  if (sources.length === 0) return "이 날의 활동 기록입니다.";
  return sources.join("\n\n");
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const byDate = parseKakaoText(text);
  const results: { date: string; title: string; tags: string[]; count: number }[] = [];

  for (const [date, messages] of byDate) {
    if (messages.length === 0) continue;

    const title = generateTitle(messages);
    const tags = extractTags(messages);
    const rawContent = messages.join("\n\n");
    const allEntries = await getAllEntries();
    const existing = allEntries.find((e) => e.date === date);
    const summary = generateNarrativeSummary(rawContent, existing?.meeting_notes);

    await createEntry({
      date,
      title,
      summary,
      tags,
      raw_content: rawContent,
      meeting_notes: existing?.meeting_notes,
    });

    results.push({ date, title, tags, count: messages.length });
  }

  return NextResponse.json({
    results: results.sort((a, b) => b.date.localeCompare(a.date)),
    totalDates: results.length,
  });
}