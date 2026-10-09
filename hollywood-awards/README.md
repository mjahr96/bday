# 🏆 Hollywood Birthday Awards

Mobile-first Award-Show-Voting für Gäste (30–100 Personen). Next.js 14 · TypeScript · Tailwind · Supabase (Postgres + Storage) · Hosting: Vercel.

## Architektur in 5 Zeilen
- Gäste scannen den QR-Code, öffnen `/vote` und tippen einmal „Red Carpet betreten“. Der Server legt eine anonyme Voter-ID an und speichert sie in einem signierten, httpOnly-Cookie (JWT). Keine Namen, keine Codes.
- Das Frontend spricht **nur** mit eigenen API-Routen (`/api/...`). Die Datenbank ist für das Internet komplett gesperrt (RLS ohne Policies); nur der Server nutzt den Service-Role-Key.
- **Doppelstimmen-Schutz auf DB-Ebene:** Tabelle `votes` hat den Primary Key `(voter_id, category_id)`. Die Postgres-Funktion `cast_vote()` prüft Status/Gast/Kategorie/Nominierten und fügt ein. Parallele Klicks, Reload, mehrere Tabs, manipuliertes Frontend: die Datenbank lässt genau **einen** Insert zu, der Rest bekommt `already_voted`.
- Die Voter-ID kommt immer aus dem signierten Cookie, nie aus dem Request-Body.
- Fotos liegen in einem **privaten** Bucket und werden nur als kurzlebige Signed URLs (1 h) an eingeloggte Gäste ausgeliefert.

## Kategorien nach Geschlecht
Jeder Gast hat ein Geschlecht (m/f), jede Kategorie eine Zielgruppe (alle / nur Männer / nur Frauen). Abstimmende sehen nur passende Kandidaten, und die Datenbank lehnt unpassende Stimmen ab. Für eine bereits eingerichtete Datenbank: `supabase/migration-gender.sql` einmal im SQL Editor ausführen.

## Seiten
| URL | Zweck |
|---|---|
| `/` | Startseite „Enter the Awards“ |
| `/vote` | Einmal bestätigen, Kategorien, Kandidaten, Abstimmung |
| `/admin` | Gäste, Kategorien, Ergebnisse, Abend (Status, QR, Löschen) |
| `/live` | Beamer-Modus (nur nach Admin-Login): Live-Balken, Gewinner-Enthüllung |
| `/datenschutz` | Datenschutzhinweis (Verantwortlichen eintragen!) |

## Setup (ca. 20 Minuten)

### 1. Supabase (kostenlos)
1. Account auf https://supabase.com → **New project** (Region: *Frankfurt/EU*).
2. **SQL Editor → New query** → Inhalt von `supabase/schema.sql` einfügen → **Run**. Das legt Tabellen, Sperr-Logik, privaten Foto-Bucket und Beispiel-Kategorien an.
3. **Project Settings → API**: kopiere `Project URL` und den `service_role`-Key (geheim!).

### 2. Lokal testen
```bash
npm install
cp .env.example .env.local     # Werte eintragen (siehe unten)
npm run dev                    # http://localhost:3000
```
`.env.local`:
- `SUPABASE_URL` – Project URL
- `SUPABASE_SERVICE_ROLE_KEY` – service_role-Key
- `SESSION_SECRET` – langer Zufallsstring (`openssl rand -base64 48`)
- `ADMIN_PASSWORD` – dein Admin-Passwort

### 3. Deployen (Vercel, kostenlos)
1. Code in ein **privates** GitHub-Repo pushen (`.env.local` ist per `.gitignore` ausgeschlossen).
2. https://vercel.com → **Add New → Project** → Repo wählen → die 4 Variablen unter *Environment Variables* eintragen → **Deploy**.
3. Fertig: `https://dein-projekt.vercel.app/vote` ist deine feste Voting-URL.

### 4. Vorbereitung für den Abend
1. `/admin` → **Gäste**: Gäste anlegen (die zur Wahl stehen) und Foto hochladen (wird automatisch verkleinert).
2. **Kategorien** prüfen, Reihenfolge ändern, deaktivieren.
3. **Abend → QR-Code** als PNG laden und ausdrucken.
4. Test mit dem eigenen Handy über den QR-Code.
5. Zum Start: **Abend → „Abstimmung offen“**. Beamer/TV: `/live` im Browser (Admin eingeloggt) → Vollbild (F11).
6. Zum Ende: **„Beendet / eingefroren“** → im Live-Bildschirm **🏆 Gewinner** → „Nächster Award“.
7. Nach der Feier: **Abend → „Nach der Feier: alles löschen“**.

> Tipp: Wenn du vorher testest, setzt „Nach der Feier: alles löschen“ Stimmen und Geräte zurück (löscht aber auch die Gäste). Beispiel-Gäste gibt es per Knopf „Beispiel-Gäste anlegen“.
>
> **Grenze des Cookie-Ansatzes:** Wer die Cookies löscht oder einen privaten Tab bzw. einen zweiten Browser nutzt, könnte eine neue Identität bekommen und nochmal abstimmen. Für eine Party unter Freunden ist das meist unkritisch. Falls du es strenger willst, geht ein einzelner gemeinsamer Party-Code (z. B. am QR-Zettel), den ich dir einbauen kann.

## Datenschutz (Vorschlag für eine private Feier – keine Rechtsberatung)
Auf der Website bereits eingebaut: Einwilligungs-Checkbox beim ersten Betreten, Seite `/datenschutz`, keine Tracker/Analytics, nur ein technisch notwendiges Cookie.
Sinnvoll für dich:
1. **Vorab informieren:** In der Einladung schreiben, dass Name + Foto in einer Abstimmung für andere Gäste sichtbar sind, Zweck, und dass alles nach der Feier gelöscht wird.
2. **Fotos nur mit Zustimmung** des Gastes hochladen (am besten kurze Zusage per Chat). Wer nicht möchte: Initialen-Karte ohne Foto (Funktion ist eingebaut), oder „nicht nominierbar“.
3. In `/datenschutz` bei *Verantwortlich* deinen Namen + Kontakt eintragen.
4. Nach der Feier alles löschen (Knopf im Admin) und Supabase/Vercel-Projekt nach Wunsch entfernen.
5. Supabase-Region EU wählen. Mit Supabase/Vercel bestehen Standard-Auftragsverarbeitungsverträge in deren Account-Einstellungen.
6. Keine Kinder-Fotos ohne Zustimmung der Eltern.

## Entscheidungen & Begründung
- **Next.js + Supabase + Vercel:** ein Repo, ein Deploy, alles im Gratis-Tarif. Postgres gibt echte Transaktions-/Constraint-Sicherheit gegen Race Conditions.
- **Anonymes Geräte-Cookie statt IP/Fingerprint/Codes:** funktioniert im gemeinsamen WLAN, kein Aufwand für Gäste, keine Namen von Abstimmenden gespeichert.
- **Selbst-Stimmen erlaubt:** ohne Identität pro Gast lässt sich nicht erkennen, wer sich selbst wählt.
- **Alle nominierbaren Gäste in jeder Kategorie:** einfach und schnell. Pro-Kategorie-Nominierungen (z. B. „Bestes Duo“) wären eine Erweiterung (Tabelle `category_nominees`).
- **Polling statt Websockets** (3–4 s): robust und ausreichend für Live-Ergebnisse.
- **Ergebnisse nur im Admin/Live-Bereich**, nie für Gäste.
