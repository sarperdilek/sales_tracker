import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookies = req.cookies.getAll();
  
  return NextResponse.json({
    session: session ? {
      user: session.user,
      expires: session.expires
    } : null,
    cookies: cookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + "...", // Güvenlik için kısalt
      // RequestCookie'de bu property'ler yok, sadece name ve value var
    })),
    headers: {
      host: req.headers.get("host"),
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      userAgent: req.headers.get("user-agent")
    }
  });
}
