import { NextResponse } from "next/server";
import { db, signPhotos } from "@/lib/db";
import { getVoter } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const voter = await getVoter();
  if (!voter) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const categoryId = new URL(req.url).searchParams.get("category_id");
  if (!categoryId) return NextResponse.json({ error: "category_id fehlt" }, { status: 400 });
  const { data: cat } = await db.from("categories").select("audience").eq("id", categoryId).maybeSingle();
  if (!cat) return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
  let q = db.from("guests").select("id, display_name, description, photo_path").eq("nominated", true);
  if (cat.audience !== "all") q = q.eq("gender", cat.audience);
  const { data } = await q.order("display_name");
  const urls = await signPhotos((data ?? []).map((g) => g.photo_path));
  return NextResponse.json({
    candidates: (data ?? []).map((g) => ({ id: g.id, display_name: g.display_name, description: g.description, photo: g.photo_path ? urls[g.photo_path] ?? null : null })),
  });
}
