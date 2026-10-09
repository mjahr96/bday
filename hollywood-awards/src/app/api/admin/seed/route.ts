import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/auth";
export async function POST() {
  const g = await adminGuard(); if (g) return g;
  const names = [["Max", "Mustermann", "m"], ["Lisa", "Müller", "f"], ["Tom", "Schneider", "m"], ["Anna", "Weber", "f"], ["Jonas", "Fischer", "m"], ["Sophie", "Bauer", "f"]];
  for (const [first, last, gender] of names) await db.from("guests").insert({ first_name: first, last_name: last, display_name: first, gender });
  return NextResponse.json({ ok: true });
}
