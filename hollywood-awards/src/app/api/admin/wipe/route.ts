import { NextResponse } from "next/server";
import { db, BUCKET } from "@/lib/db";
import { adminGuard } from "@/lib/auth";
// Löscht ALLE Gäste, Fotos und Stimmen (DSGVO: nach der Feier).
export async function POST(req: Request) {
  const g = await adminGuard(); if (g) return g;
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "LÖSCHEN") return NextResponse.json({ error: "Bestätigung fehlt." }, { status: 400 });
  const { data: files } = await db.storage.from(BUCKET).list("", { limit: 1000 });
  if (files?.length) await db.storage.from(BUCKET).remove(files.map((f) => f.name));
  await db.from("votes").delete().neq("voter_id", "00000000-0000-0000-0000-000000000000");
  await db.from("voters").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("guests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("settings").update({ voting_status: "closed" }).eq("id", 1);
  return NextResponse.json({ ok: true });
}
