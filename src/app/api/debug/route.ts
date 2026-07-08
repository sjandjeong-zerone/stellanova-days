import { NextResponse } from "next/server";
import { getAllEntries } from "@/lib/db";

export async function GET() {
  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_TOKEN;

  let dbOk = false;
  let dbError = "";
  try {
    await getAllEntries();
    dbOk = true;
  } catch (e: any) {
    dbError = e.message || String(e);
  }

  return NextResponse.json({
    hasUrl: !!tursoUrl,
    hasToken: !!tursoToken,
    urlPrefix: tursoUrl ? tursoUrl.substring(0, 25) + "..." : "MISSING",
    dbOk,
    dbError,
  });
}
