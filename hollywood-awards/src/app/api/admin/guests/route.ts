import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, BUCKET, signPhotos } from "@/lib/db";
import { adminGuard } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function savePhoto(file: File | null) {
  if (!file || !file.size) return null;
  if (!file.type.startsWith("image/") || file.size > 4_000_000) throw new Error("Foto: nur Bilder bis 4 MB.");
  const path = `${randomUUID()}.jpg`;
  const { error } = await db.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "image/jpeg" });
  if (error) throw new Error("Foto-Upload fehlgeschlagen.");
  return path;
}
const fields = (f: FormData) => ({
  first_name: String(f.get("first_name") ?? "").trim(),
  last_name: String(f.get("last_name") ?? "").trim(),
  display_name: String(f.get("display_name") ?? "").trim(),
  description: String(f.get("description") ?? "").trim() || null,
  nominated: f.get("nominated") !== "false",
  gender: f.get("gender") === "f" ? "f" : "m",
});

export async function GET() {
  const g = await adminGuard(); if (g) return g;
  const [guests, votes] = await Promise.all([
    db.from("guests").select("*").order("display_name"),
    db.from("votes").select("nominee_id"),
  ]);
  const cnt: Record<string, number> = {};
  (votes.data ?? []).forEach((v) => { cnt[v.nominee_id] = (cnt[v.nominee_id] ?? 0) + 1; });
  const urls = await signPhotos((guests.data ?? []).map((x) => x.photo_path));
  return NextResponse.json({ guests: (guests.data ?? []).map((x) => ({ ...x, photo: x.photo_path ? urls[x.photo_path] : null, votes_received: cnt[x.id] ?? 0 })) });
}

export async function POST(req: Request) {
  const g = await adminGuard(); if (g) return g;
  try {
    const f = await req.formData(); const v = fields(f);
    if (!v.first_name) return NextResponse.json({ error: "Vorname fehlt." }, { status: 400 });
    const photo_path = await savePhoto(f.get("photo") as File | null);
    const { error } = await db.from("guests").insert({ ...v, display_name: v.display_name || v.first_name, photo_path });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PUT(req: Request) {
  const g = await adminGuard(); if (g) return g;
  try {
    const f = await req.formData(); const id = String(f.get("id")); const v = fields(f);
    const { data: old } = await db.from("guests").select("photo_path").eq("id", id).single();
    const photo_path = await savePhoto(f.get("photo") as File | null);
    const { error } = await db.from("guests").update({ ...v, display_name: v.display_name || v.first_name, ...(photo_path ? { photo_path } : {}) }).eq("id", id);
    if (error) throw new Error(error.message);
    if (photo_path && old?.photo_path) await db.storage.from(BUCKET).remove([old.photo_path]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  const g = await adminGuard(); if (g) return g;
  const id = new URL(req.url).searchParams.get("id")!;
  const { data } = await db.from("guests").select("photo_path").eq("id", id).single();
  if (data?.photo_path) await db.storage.from(BUCKET).remove([data.photo_path]);
  await db.from("guests").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
