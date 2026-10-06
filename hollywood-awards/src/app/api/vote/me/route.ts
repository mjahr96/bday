import { NextResponse } from "next/server";
import { db, getStatus } from "@/lib/db";
import { getVoter } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const voter = await getVoter();
  if (!voter) return NextResponse.json({ voter: null }, { status: 401 });
  const [status, cats, votes] = await Promise.all([
    getStatus(),
    db.from("categories").select("id, title, question, emoji").eq("active", true).order("position"),
    db.from("votes").select("category_id").eq("voter_id", voter.id),
  ]);
  const voted = new Set((votes.data ?? []).map((v) => v.category_id));
  return NextResponse.json({ status, categories: (cats.data ?? []).map((c) => ({ ...c, voted: voted.has(c.id) })) });
}
