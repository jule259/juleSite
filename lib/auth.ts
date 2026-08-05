import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAuthenticated: boolean;
  username: string;
  isAdmin: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-secret-change-in-production-please-use-at-least-32-characters",
  cookieName: "julesite-session",
  ttl: 60 * 60 * 24 * 7, // 7 天有效，不用频繁登录
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // cookie 也设 7 天
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAuthenticated === true;
}
