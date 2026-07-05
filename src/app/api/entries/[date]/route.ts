import { NextRequest, NextResponse } from "next/server";
import { getEntryByDate } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const entry = getEntryByDate(date);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}