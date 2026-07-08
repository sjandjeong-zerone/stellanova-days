import { NextRequest, NextResponse } from "next/server";
import { createEntry, getEntryByDate } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { date, title, notes, images } = await request.json();

  if (!date || !title || !notes) {
    return NextResponse.json(
      { error: "date, title, and notes are required" },
      { status: 400 }
    );
  }

  const imageUrls: string[] = Array.isArray(images) ? images.filter((u: unknown) => typeof u === "string" && u.trim()) : [];

  const existing = await getEntryByDate(date);

  // Simple tag extraction from meeting title and notes
  const tagMap: Record<string, string> = {
    제품: "제품",
    배송: "배송",
    마케팅: "마케팅",
    전략: "전략",
    계약: "계약",
    브랜드: "브랜드",
    출시: "출범",
    고객: "고객",
    가격: "가격",
    카페24: "카페24",
    회의: "회의",
  };
  const combined = title + " " + notes;
  const tags = Object.entries(tagMap)
    .filter(([key]) => combined.includes(key))
    .map(([, tag]) => tag);

  const mergedImages = [...new Set([...(existing?.images || []), ...imageUrls])];

  const entry = await createEntry({
    date,
    title,
    summary: existing ? `${existing.summary}\n\n📋 ${title}: ${notes.slice(0, 300)}...` : `📋 ${title}: ${notes.slice(0, 500)}`,
    tags: [...new Set([...(existing?.tags || []), ...tags, "회의" ])],
    images: mergedImages,
    raw_content: existing?.raw_content || undefined,
    meeting_notes: notes,
  });

  return NextResponse.json({
    success: true,
    date: entry.date,
    title: entry.title,
  });
}