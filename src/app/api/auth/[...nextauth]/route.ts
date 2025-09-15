import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

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
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user && token?.email) {
        session.user.email = token.email as string;
      }
      if ((token as Record<string, unknown>).accessToken) {
        (session as Record<string, unknown>).accessToken = (token as Record<string, unknown>).accessToken;
      }
      return session;
    },
    async jwt({ token, account, profile }: { token: JWT; account?: Record<string, unknown> | null; profile?: Record<string, unknown> | null }) {
      if (account) {
        (token as Record<string, unknown>).accessToken = account["access_token"] as string | undefined;
        (token as Record<string, unknown>).refreshToken = account["refresh_token"] as string | undefined;
        (token as Record<string, unknown>).expiresAt = account["expires_at"] as number | undefined;
      }
      if (profile && typeof profile["email"] === "string") token.email = profile["email"] as string;
      return token;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Login sonrası ana sayfaya yönlendir
      const newUrl = new URL(url, baseUrl);
      if (newUrl.pathname.startsWith("/api/auth")) return baseUrl;
      if (newUrl.pathname === "/login") return baseUrl;
      if (newUrl.origin === baseUrl) return newUrl.toString();
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


