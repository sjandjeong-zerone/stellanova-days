import { NextRequest, NextResponse } from "next/server";
import { getAllEntries, createEntry, type Entry } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const entries = getAllEntries(month || undefined);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body: Omit<Entry, "id" | "created_at" | "updated_at"> =
    await request.json();
  const entry = createEntry(body);
  return NextResponse.json(entry, { status: 201 });
}