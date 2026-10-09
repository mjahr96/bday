import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/auth";

export const dynamic = "force-dynamic";
const clean = (b: any) => ({ title: String(b.title ?? "").trim(), question: String(b.question ?? "").trim() || null, emoji: String(b.emoji ?? "🏆").trim() || "🏆", active: b.active !== false, audience: ["m", "f"].includes(b.audience) ? b.audience : "all" });

export async function GET() {
  const g = await adminGuard(); if (g) return g;
  const { data } = await db.from("categories").select("*").order("position");
  return NextResponse.json({ categories: data ?? [] });
}
export async function POST(req: Request) {
  const g = await adminGuard(); if (g) return g;
  const v = clean(await req.json());
  if (!v.title) return NextResponse.json({ error: "Titel fehlt." }, { status: 400 });
  const { data: last } = await db.from("categories").select("position").order("position", { ascending: false }).limit(1);
  await db.from("categories").insert({ ...v, position: (last?.[0]?.position ?? 0) + 1 });
  return NextResponse.json({ ok: true });
}
export async function PUT(req: Request) {
  const g = await adminGuard(); if (g) return g;
  const b = await req.json();
  await db.from("categories").update(clean(b)).eq("id", b.id);
  return NextResponse.json({ ok: true });
}
export async function PATCH(req: Request) { // Reihenfolge: { order: [id, id, ...] }
  const g = await adminGuard(); if (g) return g;
  const { order } = await req.json() as { order: string[] };
  await Promise.all(order.map((id, i) => db.from("categories").update({ position: i + 1 }).eq("id", id)));
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const g = await adminGuard(); if (g) return g;
  await db.from("categories").delete().eq("id", new URL(req.url).searchParams.get("id")!);
  return NextResponse.json({ ok: true });
}
