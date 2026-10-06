import { NextResponse } from "next/server";
import { setSession, clearSession, passwordOk, isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ admin: await isAdmin() }); }
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!passwordOk(String(password ?? ""))) { await new Promise((r) => setTimeout(r, 800)); return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 }); }
  await setSession("a", { admin: true }, 60 * 60 * 12);
  return NextResponse.json({ ok: true });
}
export async function DELETE() { clearSession("a"); return NextResponse.json({ ok: true }); }
