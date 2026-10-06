"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import Avatar from "@/components/Avatar";

type Guest = { id: string; first_name: string; last_name: string; display_name: string; description: string | null; photo: string | null; nominated: boolean; votes_received: number };
type Cat = { id: string; title: string; question: string | null; emoji: string; active: boolean };
type Res = { status: string; total: number; categories: { id: string; title: string; emoji: string; rows: { id: string; name: string; votes: number }[] }[] };

const j = (url: string, method = "GET", body?: unknown) =>
  fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }));

// Foto vor dem Upload auf max. 900px verkleinern (schnell + unter dem 4,5-MB-Limit von Vercel)
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"guests" | "cats" | "results" | "event">("guests");
  useEffect(() => { j("/api/admin/login").then((r) => setAuthed(!!r.data.admin)); }, []);
  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  const tabs = [["guests", "Gäste"], ["cats", "Kategorien"], ["results", "Ergebnisse"], ["event", "Abend"]] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold"><span className="gold-text">Admin</span></h1>
        <button className="text-xs text-white/50 underline" onClick={async () => { await j("/api/admin/login", "DELETE"); setAuthed(false); }}>Abmelden</button>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`btn-ghost whitespace-nowrap ${tab === k ? "!bg-gold/20 !border-gold" : ""}`}>{l}</button>)}
      </nav>
      <div className="mt-6">{tab === "guests" ? <Guests /> : tab === "cats" ? <Cats /> : tab === "results" ? <Results /> : <Event />}</div>
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const go = async () => { const r = await j("/api/admin/login", "POST", { password: pw }); r.ok ? onDone() : setErr(r.data.error); };
  return (
    <main className="mx-auto max-w-sm px-6 pt-32 text-center">
      <h1 className="font-display text-2xl"><span className="gold-text">Admin</span></h1>
      <input type="password" className="input mt-6" placeholder="Passwort" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      {err && <p className="mt-3 text-red-400">{err}</p>}
      <button className="btn-gold mt-6" onClick={go}>Anmelden</button>
    </main>
  );
}

function Guests() {
  const [list, setList] = useState<Guest[]>([]);
  const [edit, setEdit] = useState<Guest | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", display_name: "", description: "", nominated: true });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(() => j("/api/admin/guests").then((r) => setList(r.data.guests ?? [])), []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setEdit(null); setFile(null); setForm({ first_name: "", last_name: "", display_name: "", description: "", nominated: true }); };
  const startEdit = (g: Guest) => { setEdit(g); setForm({ first_name: g.first_name, last_name: g.last_name, display_name: g.display_name, description: g.description ?? "", nominated: g.nominated }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const save = async () => {
    setBusy(true); setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (edit) fd.append("id", edit.id);
    if (file) fd.append("photo", await shrink(file), "photo.jpg");
    const r = await fetch("/api/admin/guests", { method: edit ? "PUT" : "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error ?? "Fehler");
    reset(); load();
  };
  const del = async (g: Guest) => { if (confirm(`${g.display_name} wirklich löschen? Stimmen für diese Person werden mitgelöscht.`)) { await j(`/api/admin/guests?id=${g.id}`, "DELETE"); load(); } };

  return (
    <div>
      <div className="panel space-y-3">
        <h2 className="font-display text-lg">{edit ? `Bearbeiten: ${edit.display_name}` : "Gast hinzufügen"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Vorname *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="input" placeholder="Nachname" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <input className="input" placeholder="Anzeigename (sonst Vorname)" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        <input className="input" placeholder="Kurzbeschreibung (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#d4af37]" checked={form.nominated} onChange={(e) => setForm({ ...form, nominated: e.target.checked })} /> Kann nominiert werden</label>
        {msg && <p className="text-red-400">{msg}</p>}
        <div className="flex gap-2"><button className="btn-gold !px-6 !py-3 !text-base" disabled={busy || !form.first_name.trim()} onClick={save}>{busy ? "Speichere …" : "Speichern"}</button>{edit && <button className="btn-ghost" onClick={reset}>Abbrechen</button>}</div>
      </div>

      <p className="mt-6 text-sm text-white/50">{list.length} Gäste</p>
      <ul className="mt-2 space-y-3">
        {list.map((g) => (
          <li key={g.id} className="panel flex gap-3">
            <Avatar name={g.display_name} src={g.photo} className="h-20 w-16 shrink-0 rounded-sm text-3xl" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg">{g.display_name} <span className="text-xs text-white/40">{g.first_name} {g.last_name}</span></div>
              <div className="text-xs text-white/50">{g.nominated ? "nominiert" : "nicht nominierbar"}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button className="btn-ghost !px-3 !py-1" onClick={() => startEdit(g)}>Bearbeiten</button>
                <button className="btn-ghost !px-3 !py-1 !text-red-300" onClick={() => del(g)}>Löschen</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cats() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [f, setF] = useState({ emoji: "🏆", title: "", question: "" });
  const load = useCallback(() => j("/api/admin/categories").then((r) => setCats(r.data.categories ?? [])), []);
  useEffect(() => { load(); }, [load]);
  const move = async (i: number, d: number) => { const o = cats.map((c) => c.id); [o[i], o[i + d]] = [o[i + d], o[i]]; await j("/api/admin/categories", "PATCH", { order: o }); load(); };
  const upd = async (c: Cat, patch: Partial<Cat>) => { await j("/api/admin/categories", "PUT", { ...c, ...patch }); load(); };
  return (
    <div>
      <div className="panel space-y-3">
        <h2 className="font-display text-lg">Kategorie hinzufügen</h2>
        <div className="flex gap-3"><input className="input !w-20 text-center" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} /><input className="input" placeholder="Titel *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <input className="input" placeholder="Frage, z. B. „Wer hat den besten Look?“" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
        <button className="btn-gold !px-6 !py-3 !text-base" disabled={!f.title.trim()} onClick={async () => { await j("/api/admin/categories", "POST", f); setF({ emoji: "🏆", title: "", question: "" }); load(); }}>Hinzufügen</button>
      </div>
      <ul className="mt-6 space-y-3">
        {cats.map((c, i) => (
          <li key={c.id} className={`panel ${c.active ? "" : "opacity-50"}`}>
            <div className="flex items-center gap-2"><span className="text-2xl">{c.emoji}</span><span className="flex-1 font-display text-lg">{c.title}</span>
              <button className="btn-ghost !px-3 !py-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Nach oben">↑</button>
              <button className="btn-ghost !px-3 !py-1" disabled={i === cats.length - 1} onClick={() => move(i, 1)} aria-label="Nach unten">↓</button></div>
            {c.question && <p className="mt-1 text-sm text-white/55">{c.question}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button className="btn-ghost !px-3 !py-1" onClick={() => { const title = prompt("Titel", c.title); if (title) upd(c, { title }); }}>Titel</button>
              <button className="btn-ghost !px-3 !py-1" onClick={() => { const q = prompt("Frage", c.question ?? ""); if (q !== null) upd(c, { question: q }); }}>Frage</button>
              <button className="btn-ghost !px-3 !py-1" onClick={() => upd(c, { active: !c.active })}>{c.active ? "Deaktivieren" : "Aktivieren"}</button>
              <button className="btn-ghost !px-3 !py-1 !text-red-300" onClick={async () => { if (confirm(`„${c.title}“ löschen? Stimmen dieser Kategorie gehen verloren.`)) { await j(`/api/admin/categories?id=${c.id}`, "DELETE"); load(); } }}>Löschen</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Results() {
  const [r, setR] = useState<Res | null>(null);
  useEffect(() => { const t = () => j("/api/admin/results").then((x) => setR(x.data)); t(); const i = setInterval(t, 4000); return () => clearInterval(i); }, []);
  if (!r) return null;
  return (
    <div>
      <div className="flex items-center justify-between"><p className="text-sm text-white/60">{r.total} Stimmen gesamt · Status: {r.status}</p><Link href="/live" target="_blank" className="btn-ghost">Live-Bildschirm öffnen</Link></div>
      <div className="mt-4 space-y-4">
        {r.categories.map((c) => (
          <div key={c.id} className="panel">
            <h3 className="font-display text-lg">{c.emoji} {c.title}</h3>
            <ul className="mt-2 space-y-1 text-sm">{c.rows.slice(0, 5).map((x, i) => <li key={x.id} className="flex justify-between"><span>{i === 0 && x.votes > 0 ? "👑 " : ""}{x.name}</span><span className="text-gold-light">{x.votes}</span></li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Event() {
  const [status, setStatus] = useState("upcoming"); const [qr, setQr] = useState(""); const [url, setUrl] = useState("");
  useEffect(() => {
    j("/api/admin/settings").then((r) => setStatus(r.data.status));
    const u = `${location.origin}/vote`; setUrl(u); QRCode.toDataURL(u, { width: 900, margin: 2, color: { dark: "#070605", light: "#ffffff" } }).then(setQr);
  }, []);
  const set = async (s: string) => { const r = await j("/api/admin/settings", "PATCH", { status: s }); if (r.ok) setStatus(s); };
  const opts: [string, string][] = [["upcoming", "Noch nicht offen"], ["open", "Abstimmung offen"], ["closed", "Beendet / eingefroren"]];
  return (
    <div className="space-y-6">
      <div className="panel"><h2 className="font-display text-lg">Abstimmung</h2>
        <div className="mt-3 grid gap-2">{opts.map(([k, l]) => <button key={k} onClick={() => set(k)} className={`btn-ghost ${status === k ? "!bg-gold/25 !border-gold" : ""}`}>{status === k ? "● " : "○ "}{l}</button>)}</div>
        <p className="mt-3 text-xs text-white/50">„Beendet“ friert die Ergebnisse ein: keine Stimme wird mehr angenommen. Danach auf dem Live-Bildschirm die Gewinner enthüllen.</p></div>
      <div className="panel text-center"><h2 className="font-display text-lg">QR-Code für den Eingang</h2>
        {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="QR" className="mx-auto mt-3 w-56 bg-white p-2" />}
        <p className="mt-2 break-all text-sm text-gold-light">{url}</p>{qr && <a className="btn-ghost mt-3" href={qr} download="vote-qr.png">PNG herunterladen</a>}</div>
      <div className="panel"><h2 className="font-display text-lg">Daten</h2>
        <button className="btn-ghost mt-3" onClick={async () => { if (confirm("6 Beispiel-Gäste anlegen?")) { await j("/api/admin/seed", "POST"); alert("Fertig – siehe Tab Gäste."); } }}>Beispiel-Gäste anlegen</button>
        <button className="btn-ghost mt-3 !text-red-300" onClick={async () => { const t = prompt("Löscht ALLE Gäste, Fotos und Stimmen unwiderruflich. Zur Bestätigung LÖSCHEN eintippen:"); if (t) { const r = await j("/api/admin/wipe", "POST", { confirm: t }); alert(r.ok ? "Alle Gastdaten, Fotos und Stimmen wurden gelöscht." : r.data.error); } }}>Nach der Feier: alles löschen</button></div>
    </div>
  );
}
