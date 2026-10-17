import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { login, logout, refreshAccessToken } from "./api";
import { loginErrorMessage } from "./auth-errors";
import { withBasePath } from "./paths";
function expires(token: string) {
  try {
    return (
      JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp *
      1000
    );
  } catch {
    return Date.now() + 10 * 60 * 1000;
  }
}
const rotations = new Map<string, Promise<JWT>>();
async function rotate(token: JWT): Promise<JWT> {
  const existing = rotations.get(token.refreshToken);
  if (existing) return existing;
  const task = (async () => {
    try {
      const data = await refreshAccessToken(token.refreshToken);
      return {
        ...token,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpires: expires(data.accessToken),
        error: undefined,
      };
    } catch {
      return { ...token, accessToken: "", error: "SessionExpired" };
    }
  })();
  rotations.set(token.refreshToken, task);
  setTimeout(() => rotations.delete(token.refreshToken), 10000);
  return task;
}
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: withBasePath("/login"), error: withBasePath("/login") },
  providers: [
    CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
        remember: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        let data;
        try {
          data = await login(credentials.email, credentials.password);
        } catch (error) {
          throw new Error(loginErrorMessage(error));
        }
        if (data.user.role !== "ADMIN") {
          await logout(data.refreshToken).catch(() => undefined);
          throw new Error("This account does not have administrator access.");
        }
        return {
          id: data.user._id,
          email: data.user.email,
          name: data.user.displayName,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpires: expires(data.accessToken),
          profile: data.user,
          remember: credentials.remember === "true",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user)
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          profile: user.profile,
          loginExpires:
            Date.now() + (user.remember ? 30 * 24 : 12) * 60 * 60 * 1000,
        };
      if (Date.now() > token.loginExpires)
        return { ...token, accessToken: "", error: "SessionExpired" };
      return Date.now() < token.accessTokenExpires - 60000
        ? token
        : rotate(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.role = token.profile.role;
      session._id = token.profile._id;
      session.user = { ...session.user, ...token.profile };
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.refreshToken)
        await logout(token.refreshToken).catch(() => undefined);
    },
  },
};
