import type { DefaultSession } from "next-auth";
import type { User as ApiUser } from "@/lib/types";
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    role: string;
    _id: string;
    error?: string;
    user: DefaultSession["user"] & ApiUser;
  }
  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    profile: ApiUser;
    remember?: boolean;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    loginExpires: number;
    profile: ApiUser;
    error?: string;
  }
}
