import Link from "next/link";
export const metadata = { title: "Datenschutz – Hollywood Birthday Awards" };
export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-xl px-5 py-12 leading-relaxed text-white/80">
      <Link href="/" className="text-sm text-gold">← Zurück</Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold"><span className="gold-text">Datenschutz</span></h1>
      <p className="mt-4">Diese Seite gehört zu unserer privaten Geburtstagsfeier. Sie ist nur für eingeladene Gäste gedacht.</p>
      <h2 className="mt-6 font-display text-xl text-gold-light">Was wir speichern</h2>
      <p>Von dir als Abstimmendem nur eine zufällige Geräte-ID und deine abgegebenen Stimmen, ohne Namen und ohne Konto. Von den nominierten Gästen: Name, Foto und optional eine kurze Beschreibung. Keine Tracker, keine Werbung.</p>
      <h2 className="mt-6 font-display text-xl text-gold-light">Wozu</h2>
      <p>Nur für die Abstimmung während der Feier. Namen und Fotos der nominierten Gäste sind für alle Abstimmenden sichtbar. Ergebnisse sieht nur das Gastgeber-Team.</p>
      <h2 className="mt-6 font-display text-xl text-gold-light">Cookie</h2>
      <p>Wir setzen einen technisch notwendigen Cookie, damit wir dein Gerät wiedererkennen und doppelte Stimmen verhindern. Er enthält keine Tracking-Daten.</p>
      <h2 className="mt-6 font-display text-xl text-gold-light">Löschung</h2>
      <p>Nach der Feier löschen wir alle Gästedaten, Fotos und Stimmen. Du kannst jederzeit vorher die Löschung deiner Daten verlangen.</p>
      <h2 className="mt-6 font-display text-xl text-gold-light">Verantwortlich</h2>
      <p>[Dein Name, E-Mail-Adresse – bitte hier eintragen]</p>
      <p className="mt-2 text-sm text-white/50">Technisch gehostet über Supabase und Vercel (Auftragsverarbeiter, Server in der EU wählbar).</p>
    </main>
  );
}
