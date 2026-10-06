import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rise text-5xl" aria-hidden>🏆</div>
      <h1 className="rise mt-6 font-display text-4xl font-extrabold leading-tight sm:text-5xl" style={{ animationDelay: ".1s" }}>
        <span className="gold-text">Hollywood<br />Birthday Awards</span>
      </h1>
      <p className="rise mt-4 font-display text-xl italic text-gold-light" style={{ animationDelay: ".2s" }}>30 Years of Fame</p>
      <div className="carpet rise my-8 w-40" style={{ animationDelay: ".3s" }} />
      <p className="rise max-w-sm text-lg text-white/75" style={{ animationDelay: ".4s" }}>Willkommen zu unserer ganz persönlichen Award Night.</p>
      <Link href="/vote" className="btn-gold rise mt-10" style={{ animationDelay: ".5s" }}>Enter the Awards</Link>
      <p className="rise mt-12 text-sm tracking-widest text-gold/70" style={{ animationDelay: ".6s" }}>🎬 Red Carpet &nbsp; ⭐ 30 Years &nbsp; 🏆 Awards Night</p>
      <Link href="/datenschutz" className="mt-10 text-xs text-white/40 underline">Datenschutz</Link>
    </main>
  );
}
