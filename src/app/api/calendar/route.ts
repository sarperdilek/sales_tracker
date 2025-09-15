import { NextRequest, NextResponse } from "next/server";
import { createIcsContent, buildGoogleCalendarLink } from "@/lib/calendar";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { type: "ics" | "google"; title: string; description?: string; startIso: string; durationMinutes?: number };
    const { type, title, description, startIso, durationMinutes } = body;
    if (!type || !title || !startIso) return NextResponse.json({ detail: "Eksik parametre" }, { status: 400 });

    if (type === "ics") {
      const content = createIcsContent({ title, description, startIso, durationMinutes });
      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename=event.ics`,
        },
      });
    } else {
      const link = buildGoogleCalendarLink({ title, details: description, startIso, durationMinutes });
      return NextResponse.json({ url: link });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}


