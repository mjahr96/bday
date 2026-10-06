import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "./db";

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || "missing-secret");

export async function setSession(name: "g" | "a", payload: Record<string, unknown>, maxAgeSec: number) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime(`${maxAgeSec}s`).sign(key());
  cookies().set(name, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: maxAgeSec });
}
export function clearSession(name: "g" | "a") { cookies().set(name, "", { path: "/", maxAge: 0 }); }

async function read(name: string): Promise<any | null> {
  const t = cookies().get(name)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}

/** Anonymer Abstimmender (Gerät) aus dem signierten Cookie – ID wird gegen die DB geprüft. */
export async function getVoter() {
  const p = await read("g");
  if (!p?.vid) return null;
  const { data } = await db.from("voters").select("id").eq("id", p.vid).maybeSingle();
  return data;
}
export async function isAdmin() { return (await read("a"))?.admin === true; }
export async function adminGuard() {
  return (await isAdmin()) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
export function passwordOk(input: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(process.env.ADMIN_PASSWORD || "\u0000never").digest();
  return !!process.env.ADMIN_PASSWORD && timingSafeEqual(a, b);
}
