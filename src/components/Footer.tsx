import { site } from '../data';

export default function Footer() {
  if (!site.socials.length) return null;
  return (
    <footer className="bg-bg pt-16 md:pt-20 pb-8 md:pb-12 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-center gap-5">
        {site.socials.map((s) => {
          const external = s.href.startsWith('http');
          return (
            <a
              key={s.label}
              href={s.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </footer>
  );
}
