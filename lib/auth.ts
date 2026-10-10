import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAll } from "./store";
import type { PublicUser, User } from "./types";

const COOKIE = "rm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.VERCEL) throw new Error("SESSION_SECRET is missing or too short. Add it in Vercel and redeploy.");
    return new TextEncoder().encode("local-development-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function publicUser(u: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function startSession(user: User) {
  const token = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const users = await readAll("users");
    return users.find((u) => u.id === payload.uid) ?? null;
  } catch {
    return null;
  }
}

/** For pages: send the visitor to /login if not signed in. */
export async function requirePageUser(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    const users = await readAll("users");
    redirect(users.length === 0 ? "/setup" : "/login");
  }
  return user;
}
