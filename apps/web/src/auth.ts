import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, profile }) {
      const p = profile as { id?: string | number; login?: string } | undefined;
      if (p?.id != null) token.githubId = String(p.id);
      if (p?.login) token.githubLogin = String(p.login).toLowerCase();
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.githubId = typeof token.githubId === "string" ? token.githubId : undefined;
        session.user.githubLogin = typeof token.githubLogin === "string" ? token.githubLogin : undefined;
      }
      return session;
    }
  },
  trustHost: true
});
