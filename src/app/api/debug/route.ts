import { NextResponse } from "next/server";

export async function GET() {
  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_TOKEN;
  return NextResponse.json({
    hasUrl: !!tursoUrl,
    hasToken: !!tursoToken,
    urlPrefix: tursoUrl ? tursoUrl.substring(0, 20) + "..." : "MISSING",
  });
}
