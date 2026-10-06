import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/auth";
export async function POST() {
  const g = await adminGuard(); if (g) return g;
  const names = [["Max", "Mustermann"], ["Lisa", "Müller"], ["Tom", "Schneider"], ["Anna", "Weber"], ["Jonas", "Fischer"], ["Sophie", "Bauer"]];
  for (const [first, last] of names) await db.from("guests").insert({ first_name: first, last_name: last, display_name: first });
  return NextResponse.json({ ok: true });
}
