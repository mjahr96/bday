import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVoter, setSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Erstes Betreten: legt eine anonyme Voter-ID an und speichert sie im signierten Cookie.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.consent !== true) return NextResponse.json({ error: "Bitte bestätige zuerst den Hinweis." }, { status: 400 });
  if (await getVoter()) return NextResponse.json({ ok: true });
  const { data, error } = await db.from("voters").insert({}).select("id").single();
  if (error || !data) {
    console.error("voters insert failed:", error);
    return NextResponse.json({ error: `Serverfehler: ${error?.message ?? "unbekannt"}` }, { status: 500 });
  }
  await setSession("g", { vid: data.id }, 60 * 60 * 24 * 3);
  return NextResponse.json({ ok: true });
}
