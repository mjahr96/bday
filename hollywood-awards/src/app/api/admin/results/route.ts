import { NextResponse } from "next/server";
import { db, getStatus, signPhotos } from "@/lib/db";
import { adminGuard } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  const g = await adminGuard(); if (g) return g;
  const [cats, guests, res, status] = await Promise.all([
    db.from("categories").select("id, title, emoji, active").order("position"),
    db.from("guests").select("id, display_name, photo_path, nominated"),
    db.rpc("vote_results"),
    getStatus(),
  ]);
  const urls = await signPhotos((guests.data ?? []).map((x) => x.photo_path));
  const byCat: Record<string, Record<string, number>> = {};
  let total = 0;
  (res.data ?? []).forEach((r: any) => { (byCat[r.category_id] ??= {})[r.nominee_id] = Number(r.votes); total += Number(r.votes); });
  const categories = (cats.data ?? []).filter((c) => c.active).map((c) => ({
    id: c.id, title: c.title, emoji: c.emoji,
    rows: (guests.data ?? []).filter((x) => x.nominated || byCat[c.id]?.[x.id])
      .map((x) => ({ id: x.id, name: x.display_name, photo: x.photo_path ? urls[x.photo_path] ?? null : null, votes: byCat[c.id]?.[x.id] ?? 0 }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name)),
  }));
  return NextResponse.json({ status, total, categories });
}
