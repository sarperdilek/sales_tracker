import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ detail: "Yetkisiz" }, { status: 401 });
  const accessToken = (session as Record<string, unknown>)["accessToken"] as string | undefined;
  if (!accessToken) return NextResponse.json({ detail: "Erişim anahtarı yok" }, { status: 401 });

  try {
    const body = (await req.json()) as {
      fileName: string;
      mimeType: string;
      dataBase64: string; // base64 (raw, no data URL prefix)
      folderId?: string;
    };
    const { fileName, mimeType, dataBase64, folderId } = body;
    if (!fileName || !mimeType || !dataBase64) return NextResponse.json({ detail: "Eksik parametre" }, { status: 400 });

    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2 });

    const buffer = Buffer.from(dataBase64, "base64");
    const candidate = folderId || (process.env.GOOGLE_DRIVE_FOLDER_ID as string | undefined);
    const parents = candidate ? [candidate] : undefined;

    const res = await drive.files.create({
      requestBody: { name: fileName, parents: parents?.length ? parents : undefined },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id, webViewLink",
    });

    return NextResponse.json({ id: res.data.id, webViewLink: res.data.webViewLink });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Yükleme hatası";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}


