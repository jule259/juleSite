import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAdmin: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-secret-change-in-production-please-use-at-least-32-characters",
  cookieName: "julesite-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
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
