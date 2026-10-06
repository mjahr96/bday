import { NextResponse } from "next/server";
import { db, signPhotos } from "@/lib/db";
import { getVoter } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const voter = await getVoter();
  if (!voter) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await db.from("guests").select("id, display_name, description, photo_path")
    .eq("nominated", true).order("display_name");
  const urls = await signPhotos((data ?? []).map((g) => g.photo_path));
  return NextResponse.json({
    candidates: (data ?? []).map((g) => ({ id: g.id, display_name: g.display_name, description: g.description, photo: g.photo_path ? urls[g.photo_path] ?? null : null })),
  });
}
