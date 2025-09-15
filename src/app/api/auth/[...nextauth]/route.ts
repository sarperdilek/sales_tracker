import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session, Account, Profile } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user && token?.email) {
        session.user.email = token.email as string;
      }
      const tokenRecord = token as unknown as Record<string, unknown>;
      const sessionRecord = session as unknown as Record<string, unknown>;
      if (tokenRecord.accessToken) {
        sessionRecord.accessToken = tokenRecord.accessToken;
      }
      return session;
    },
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile | undefined }) {
      const tokenRecord = token as unknown as Record<string, unknown>;
      if (account) {
        const acc = account as unknown as { access_token?: string; refresh_token?: string; expires_at?: number };
        tokenRecord.accessToken = acc.access_token;
        tokenRecord.refreshToken = acc.refresh_token;
        tokenRecord.expiresAt = acc.expires_at;
      }
      if (profile && typeof (profile as { email?: unknown }).email === "string") {
        token.email = (profile as { email?: string }).email as string;
      }
      return token as JWT;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Güvenli alanlara sabitle - döngüyü önle
      if (url.startsWith("/")) {
        // Relative URL'ler için baseUrl kullan
        return `${baseUrl}${url}`;
      }
      
      // Absolute URL'ler için origin kontrolü
      try {
        const urlObj = new URL(url);
        // Sadece aynı origin'e izin ver
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch {
        // Geçersiz URL'ler için baseUrl döndür
      }
      
      // Varsayılan olarak ana sayfaya yönlendir
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


