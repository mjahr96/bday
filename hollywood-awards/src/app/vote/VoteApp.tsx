"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import Avatar from "@/components/Avatar";

type Cat = { id: string; title: string; question: string | null; emoji: string; voted: boolean };
type Me = { status: "upcoming" | "open" | "closed"; categories: Cat[] };
type Cand = { id: string; display_name: string; description: string | null; photo: string | null };
type View = { t: "list" } | { t: "cat"; cat: Cat } | { t: "done"; cat: Cat; name: string };

async function api(url: string, body?: unknown) {
  const r = await fetch(url, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

export default function VoteApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ t: "list" });

  const load = useCallback(async () => {
    const r = await api("/api/vote/me");
    setMe(r.ok ? (r.data as Me) : null);
    setLoading(false);
    return r.ok ? (r.data as Me) : null;
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Shell><p className="mt-24 text-center text-gold/70">Der Vorhang öffnet sich …</p></Shell>;
  if (!me) return <Shell><Welcome onDone={load} /></Shell>;

  return (
    <Shell>
      <header className="text-center">
        <h1 className="font-display text-xl font-extrabold"><span className="gold-text">Hollywood Birthday Awards</span></h1>
        <p className="mt-3 text-lg">Willkommen 👋</p>
      </header>

      {view.t === "list" && <List me={me} onPick={(cat) => setView({ t: "cat", cat })} />}
      {view.t === "cat" && (
        <Category cat={view.cat} open={me.status === "open"} onBack={() => setView({ t: "list" })}
          onVoted={async (name) => { const cat = view.cat; await load(); setView({ t: "done", cat, name }); }}
          onConflict={async () => { await load(); setView({ t: "list" }); }} />
      )}
      {view.t === "done" && <Done me={me} cat={view.cat} name={view.name}
        onNext={() => { const next = me.categories.find((c) => !c.voted); setView(next ? { t: "cat", cat: next } : { t: "list" }); }}
        onList={() => setView({ t: "list" })} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-8">{children}</main>;
}

function Welcome({ onDone }: { onDone: () => Promise<unknown> }) {
  const [ok, setOk] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const enter = async () => {
    setBusy(true); setErr("");
    const r = await api("/api/vote/login", { consent: ok });
    if (!r.ok) { setErr(r.data.error ?? "Fehler"); setBusy(false); return; }
    await onDone(); setBusy(false);
  };
  return (
    <div className="spot-in mt-10 text-center">
      <div className="text-4xl">🏆</div>
      <h1 className="mt-4 font-display text-3xl font-extrabold"><span className="gold-text">Hollywood<br />Birthday Awards</span></h1>
      <p className="mt-3 font-display italic text-gold-light">30 Years of Fame</p>
      <div className="carpet mx-auto my-6 w-32" />
      <p className="mx-auto max-w-xs text-white/70">Willkommen zu unserer ganz persönlichen Award Night. Vergib deine Stimmen, pro Kategorie einmal.</p>
      <label className="mx-auto mt-8 flex max-w-xs items-start gap-3 text-left text-sm text-white/70">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[#d4af37]" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>Ich bin einverstanden, dass in der Abstimmung Namen und Fotos der Gäste angezeigt werden und dieses Gerät per Cookie wiedererkannt wird. <Link href="/datenschutz" className="text-gold underline">Datenschutz</Link></span>
      </label>
      {err && <p role="alert" className="mt-4 text-red-400">{err}</p>}
      <button className="btn-gold mt-8" disabled={busy || !ok} onClick={enter}>{busy ? "Einen Moment …" : "Red Carpet betreten"}</button>
    </div>
  );
}

function List({ me, onPick }: { me: Me; onPick: (c: Cat) => void }) {
  const done = me.categories.filter((c) => c.voted).length;
  return (
    <section className="mt-8">
      <div className="carpet mb-6" />
      <h2 className="text-center font-display text-2xl italic text-gold-light">Your Awards</h2>
      <p className="mt-1 text-center text-sm text-white/55">{done} von {me.categories.length} abgestimmt</p>
      {me.status !== "open" && (
        <p className="panel mt-5 text-center text-gold-light">{me.status === "upcoming" ? "Die Abstimmung ist noch nicht geöffnet. Bitte noch einen Moment Geduld." : "Die Abstimmung ist beendet. Danke fürs Mitmachen!"}</p>
      )}
      <ul className="mt-6 space-y-3">
        {me.categories.map((c) => (
          <li key={c.id}>
            <button disabled={c.voted || me.status !== "open"} onClick={() => onPick(c)}
              className={`panel flex w-full items-center gap-4 text-left transition active:scale-[.99] ${c.voted ? "opacity-60" : "hover:border-gold"}`}>
              <span className="text-3xl">{c.emoji}</span>
              <span className="flex-1 font-display text-lg">{c.title}</span>
              <span className={`text-sm ${c.voted ? "text-gold" : "text-white/60"}`}>{c.voted ? "✅ Abgestimmt" : "○ Abstimmen"}</span>
            </button>
          </li>
        ))}
      </ul>
      {me.categories.length > 0 && done === me.categories.length && <p className="mt-8 text-center font-display text-xl text-gold-light">Du hast alle Awards vergeben. 🎬 Danke!</p>}
    </section>
  );
}

function Category({ cat, open, onBack, onVoted, onConflict }: { cat: Cat; open: boolean; onBack: () => void; onVoted: (name: string) => void; onConflict: () => void }) {
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [sel, setSel] = useState<Cand | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api("/api/vote/candidates").then((r) => setCands(r.ok ? r.data.candidates : [])); }, []);

  const cast = async () => {
    if (!sel || busy) return;
    setBusy(true); setErr("");
    const r = await api("/api/vote/cast", { category_id: cat.id, nominee_id: sel.id });
    if (r.ok) { confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors: ["#d4af37", "#f3e0a1", "#ffffff", "#8e1b24"] }); onVoted(sel.display_name); return; }
    if (r.data.code === "already_voted") return onConflict();
    setErr(r.data.error ?? "Fehler"); setBusy(false); setConfirm(false);
  };

  return (
    <section className="spot-in mt-6">
      <button onClick={onBack} className="text-sm text-gold/80">← Alle Kategorien</button>
      <div className="mt-4 text-center">
        <div className="text-4xl">{cat.emoji}</div>
        <h2 className="mt-2 font-display text-3xl font-extrabold"><span className="gold-text">{cat.title}</span></h2>
        {cat.question && <p className="mt-2 font-display italic text-white/70">„{cat.question}“</p>}
      </div>
      {!open && <p className="panel mt-6 text-center">Die Abstimmung ist gerade nicht geöffnet.</p>}
      {cands === null && <p className="mt-10 text-center text-gold/70">Lade Nominierte …</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 pb-28">
        {cands?.map((c) => (
          <button key={c.id} onClick={() => setSel(c)} aria-pressed={sel?.id === c.id}
            className={`overflow-hidden rounded-sm border bg-coal text-left transition active:scale-[.98] ${sel?.id === c.id ? "border-gold shadow-[0_0_0_2px_#d4af37,0_0_40px_-6px_#d4af37]" : "border-gold/20"}`}>
            <Avatar name={c.display_name} src={c.photo} className="aspect-[4/5] w-full" />
            <div className="p-3">
              <div className="font-display text-lg leading-tight">{c.display_name}</div>
              <div className="mt-1 text-xs text-gold/80">{sel?.id === c.id ? "✔ Ausgewählt" : "⭐ Nominiert"}</div>
            </div>
          </button>
        ))}
      </div>
      {err && <p role="alert" className="text-center text-red-400">{err}</p>}

      {sel && open && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gold/30 bg-ink/95 p-4 backdrop-blur" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button className="btn-gold mx-auto flex w-full max-w-xl" onClick={() => setConfirm(true)}>Für {sel.display_name} abstimmen</button>
        </div>
      )}

      {confirm && sel && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/80 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="spot-in panel w-full max-w-sm text-center">
            <Avatar name={sel.display_name} src={sel.photo} className="mx-auto h-28 w-28 rounded-full border-2 border-gold" />
            <h3 className="mt-4 font-display text-2xl">Bist du sicher?</h3>
            <p className="mt-2 text-white/70">Deine Stimme für <b className="text-gold-light">{sel.display_name}</b> in „{cat.title}“. Du kannst sie später nicht mehr ändern.</p>
            <button className="btn-gold mt-6 w-full" disabled={busy} onClick={cast}>{busy ? "Sende …" : "Abstimmen"}</button>
            <button className="btn-ghost mt-3 w-full" disabled={busy} onClick={() => setConfirm(false)}>Zurück</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Done({ me, cat, name, onNext, onList }: { me: Me; cat: Cat; name: string; onNext: () => void; onList: () => void }) {
  const remaining = me.categories.filter((c) => !c.voted).length;
  return (
    <section className="spot-in mt-16 text-center">
      <div className="text-5xl">🎬</div>
      <h2 className="mt-4 font-display text-3xl italic"><span className="gold-text">And the Oscar goes to …</span></h2>
      <p className="mt-6 text-xl">{name}?</p>
      <p className="mt-2 text-white/65">Deine Stimme in „{cat.title}“ wurde erfolgreich abgegeben.</p>
      {remaining > 0 ? <button className="btn-gold mt-10" onClick={onNext}>Nächste Kategorie</button> : <p className="mt-10 font-display text-xl text-gold-light">Alle Awards vergeben. Danke! 🏆</p>}
      <button className="btn-ghost mt-4" onClick={onList}>Übersicht</button>
    </section>
  );
}
