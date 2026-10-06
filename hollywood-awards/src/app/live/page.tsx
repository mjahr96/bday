"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Avatar from "@/components/Avatar";

type Row = { id: string; name: string; photo: string | null; votes: number };
type Cat = { id: string; title: string; emoji: string; rows: Row[] };
type Res = { status: string; total: number; categories: Cat[] };

export default function Live() {
  const [r, setR] = useState<Res | null>(null);
  const [denied, setDenied] = useState(false);
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<"live" | "winners">("live");
  const [revealed, setRevealed] = useState(0);
  const lastTop = useRef("");

  useEffect(() => {
    const t = async () => { const x = await fetch("/api/admin/results", { cache: "no-store" }); if (x.status === 401) return setDenied(true); setR(await x.json()); };
    t(); const iv = setInterval(t, 3000); return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (mode !== "live") return; const iv = setInterval(() => setI((n) => n + 1), 12000); return () => clearInterval(iv); }, [mode]);

  if (denied) return <main className="p-10 text-center">Bitte zuerst unter <a className="text-gold underline" href="/admin">/admin</a> anmelden.</main>;
  if (!r || !r.categories.length) return <main className="p-10 text-center text-gold/70">Warte auf Daten …</main>;

  if (mode === "winners") {
    const shown = r.categories.slice(0, revealed);
    const next = () => { if (revealed < r.categories.length) { setRevealed(revealed + 1); confetti({ particleCount: 220, spread: 100, origin: { y: 0.6 }, colors: ["#d4af37", "#f3e0a1", "#fff"] }); } };
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-center">
        <h1 className="font-display text-4xl font-extrabold"><span className="gold-text">And the winners are …</span></h1>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => { const w = c.rows[0]; return (
            <div key={c.id} className="panel spot-in">
              <div className="text-sm text-gold-light">{c.emoji} {c.title}</div>
              {w && w.votes > 0 ? <><Avatar name={w.name} src={w.photo} className="mx-auto mt-3 h-40 w-40 rounded-full border-2 border-gold" /><div className="mt-3 font-display text-3xl">🥇 {w.name}</div><div className="text-sm text-white/50">{w.votes} Stimmen</div></> : <div className="mt-6 text-white/50">Keine Stimmen</div>}
            </div>); })}
        </div>
        <div className="mt-10 flex justify-center gap-3">
          <button className="btn-gold" onClick={next} disabled={revealed >= r.categories.length}>{revealed === 0 ? "Gewinner enthüllen" : revealed >= r.categories.length ? "Alle enthüllt 🎬" : "Nächster Award"}</button>
          <button className="btn-ghost" onClick={() => setMode("live")}>Zurück</button>
        </div>
      </main>
    );
  }

  const c = r.categories[i % r.categories.length];
  const max = Math.max(1, ...c.rows.map((x) => x.votes));
  const top = c.rows.slice(0, 5);
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center px-6 py-10">
      <p className="text-center text-gold/70">Hollywood Birthday Awards · Live · {r.total} Stimmen</p>
      <h1 key={c.id} className="spot-in mt-4 text-center font-display text-5xl font-extrabold"><span className="gold-text">{c.emoji} {c.title}</span></h1>
      <ol className="mt-10 space-y-4">
        {top.map((x, n) => (
          <li key={x.id} className="flex items-center gap-4">
            <span className="w-8 font-display text-2xl text-gold">{n + 1}</span>
            <Avatar name={x.name} src={x.photo} className="h-16 w-16 shrink-0 rounded-full border border-gold/50 !text-2xl" />
            <div className="flex-1"><div className="flex justify-between font-display text-2xl"><span>{x.name}</span><span className="text-gold-light">{x.votes}</span></div>
              <div className="mt-1 h-3 overflow-hidden rounded-sm bg-white/10"><div className="h-full bg-gradient-to-r from-gold-dark to-gold-light transition-all duration-700" style={{ width: `${(x.votes / max) * 100}%` }} /></div></div>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex justify-center gap-3 opacity-60 hover:opacity-100">
        <button className="btn-ghost" onClick={() => setI(i - 1 + r.categories.length)}>←</button>
        <button className="btn-ghost" onClick={() => setI(i + 1)}>→</button>
        <button className="btn-ghost" onClick={() => { setRevealed(0); setMode("winners"); }} disabled={r.status !== "closed"} title={r.status !== "closed" ? "Erst Abstimmung beenden" : ""}>🏆 Gewinner</button>
      </div>
    </main>
  );
}
