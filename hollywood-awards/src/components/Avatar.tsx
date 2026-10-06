/* eslint-disable @next/next/no-img-element */
export default function Avatar({ name, src, className = "" }: { name: string; src?: string | null; className?: string }) {
  if (src) return <img src={src} alt={name} loading="lazy" className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-coal to-ink font-display text-5xl text-gold ${className}`} aria-label={name}>
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}
