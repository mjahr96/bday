import { NextResponse } from "next/server";
import { db, getStatus } from "@/lib/db";
import { adminGuard } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() { const g = await adminGuard(); if (g) return g; return NextResponse.json({ status: await getStatus() }); }
export async function PATCH(req: Request) {
  const g = await adminGuard(); if (g) return g;
  const { status } = await req.json();
  if (!["upcoming", "open", "closed"].includes(status)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await db.from("settings").update({ voting_status: status }).eq("id", 1);
  return NextResponse.json({ ok: true, status });
}
