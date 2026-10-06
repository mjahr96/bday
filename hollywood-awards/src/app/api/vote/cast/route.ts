import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVoter } from "@/lib/auth";

export const dynamic = "force-dynamic";
const MSG: Record<string, [number, string]> = {
  not_open: [403, "Die Abstimmung ist gerade nicht geöffnet."],
  already_voted: [409, "Du hast in dieser Kategorie bereits abgestimmt."],
  invalid_guest: [401, "Bitte öffne die Seite neu über den QR-Code."],
  invalid_category: [400, "Diese Kategorie ist nicht verfügbar."],
  invalid_nominee: [400, "Diese Person ist nicht nominiert."],
};

export async function POST(req: Request) {
  const voter = await getVoter();
  if (!voter) return NextResponse.json({ error: "Bitte neu anmelden." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.category_id !== "string" || typeof b.nominee_id !== "string") return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  // Voter-ID kommt aus dem signierten Cookie, NIE aus dem Request-Body.
  const { data, error } = await db.rpc("cast_vote", { p_voter: voter.id, p_category: b.category_id, p_nominee: b.nominee_id });
  if (error) return NextResponse.json({ error: "Serverfehler. Bitte erneut versuchen." }, { status: 500 });
  if (data === "ok") return NextResponse.json({ ok: true });
  const [status, error_msg] = MSG[data as string] ?? [400, "Unbekannter Fehler."];
  return NextResponse.json({ error: error_msg, code: data }, { status });
}
