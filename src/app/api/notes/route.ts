import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { appendRow, queryRows } from "@/lib/sheets";
import { summarizeNote } from "@/lib/gemini";
import { reverseGeocode } from "@/lib/geocoding";


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ detail: "Yetkisiz" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const result = searchParams.get("result") || "";
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const wantStats = searchParams.get("stats") === "1";

  const values = await queryRows("Sayfa1!A:L");
  const rows = values.slice(1);
  let items = rows
    .map((r: string[], idx: number) => ({
      id: String(idx + 1),
      sheetRow: idx + 2,
      email: r[0] || "",
      createdAt: r[1] || "",
      company: r[2] || "",
      contact: r[3] || "",
      result: r[4] || "",
      reminderAt: r[5] || "",
      rawNote: r[6] || "",
      summary: r[7] || "",
      address: r[8] || "",
      cityDistrict: r[9] || "",
      createdAtIso: r[10] || "",
    }))
    .filter((it) => it.email === session.user?.email)
    .filter((it) => (q ? it.company.toLowerCase().includes(q) : true))
    .filter((it) => (result ? it.result === result : true))
    .filter((it) => (start ? (it.createdAtIso || "") >= start : true))
    .filter((it) => (end ? (it.createdAtIso || "") <= end : true));

  // Basit sıralama: ISO tarihe göre azalan (güvenilir)
  items = items.sort((a, b) => (a.createdAtIso! < b.createdAtIso! ? 1 : -1));

  if (wantStats) {
    const total = items.length;
    const positive = items.filter((i) => i.result === "Olumlu").length;
    const later = items.filter((i) => i.result === "Sonraya Randevu").length;
    const rate = total ? (positive + later) / total : 0;
    return NextResponse.json({ total, positive, later, rate });
  }

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ detail: "Yetkisiz" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { company: string; contact?: string; result: string; reminderIso?: string | null; rawNote?: string; coords?: { lat: number; lng: number } };
    const { company, contact, result, reminderIso, rawNote, coords } = body;
    if (!company || !result) return NextResponse.json({ detail: "Zorunlu alanlar eksik" }, { status: 400 });

    // Europe/Istanbul saat dilimi ile TR formatı ve ISO saklama
    const now = new Date();
    const createdAtIso = now.toISOString();
    const createdAtTr = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    const summary = await summarizeNote(rawNote || "");
    const location = coords?.lat && coords?.lng ? await reverseGeocode(coords.lat, coords.lng) : { address: "", cityDistrict: "" };

    await appendRow([
      session.user.email,
      createdAtTr, // İnsan okunur TR format
      company,
      contact || "",
      result,
      reminderIso || "",
      rawNote || "",
      summary || "",
      location.address,
      location.cityDistrict,
      createdAtIso, // Ek kolon: ISO format (sıralama/filtre için güvenilir)
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ detail: "Yetkisiz" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { sheetRow: number; result?: string; reminderIso?: string | null };
    const { sheetRow, result, reminderIso } = body;
    if (!sheetRow) return NextResponse.json({ detail: "Eksik parametre" }, { status: 400 });

    // Mevcut satırı oku
    const range = `Sayfa1!A${sheetRow}:L${sheetRow}`;
    const rows = await queryRows(range);
    const current = rows[0] || [];
    // Sütunlar: 0..10 (A..L)
    if (typeof result === "string") current[4] = result;
    if (typeof reminderIso !== "undefined") current[5] = reminderIso || "";

    // Güncelle
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;
    const sheets = await (await import("@/lib/sheets")).getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [current as string[]] },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}


