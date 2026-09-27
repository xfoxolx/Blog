import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useLocale, useList } from '../i18n';
import HlsVideo from './HlsVideo';
import SearchButton from './Search';
import { site } from '../data';

const GlowCursor = lazy(() => import('./GlowCursor'));

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero({ started }: { started: boolean }) {
  const { t, locale, setLocale } = useLocale();
  const topics = useList('hero.topics');
  const [scrolled, setScrolled] = useState(false);
  const [topicIndex, setTopicIndex] = useState(0);
  // ponytail: coarse pointer / reduced-motion directly off, no settings UI until asked
  const [glowOn] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!topics.length) return;
    const id = setInterval(() => setTopicIndex((i) => (i + 1) % topics.length), 2000);
    return () => clearInterval(id);
  }, [topics.length]);

  useEffect(() => {
    if (!started) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.name-reveal', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.1 })
        .fromTo(
          '.blur-in',
          { opacity: 0, filter: 'blur(10px)', y: 20 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1, stagger: 0.1, delay: 0.3 },
          '<'
        );
    });
    return () => ctx.revert();
  }, [started]);

  const links = [
    { label: t('nav.featured'), to: '/featured' },
    { label: t('nav.categories'), to: '/categories' },
    { label: t('nav.archive'), to: '/posts' },
  ];

  return (
    <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">
      {site.heroVideo ? <HlsVideo /> : null}
      {glowOn && (
        <Suspense fallback={null}>
          <GlowCursor style={{ position: 'absolute', inset: 0, zIndex: 5 }} />
        </Suspense>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />

      {/* Floating nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
        <div
          className={`inline-flex items-center rounded-full liquid-glass px-2 py-2 transition-shadow ${
            scrolled ? 'shadow-md shadow-black/10' : ''
          }`}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('home');
            }}
            className="w-9 h-9 rounded-full p-[2px] accent-gradient hover:[background:linear-gradient(270deg,#89AACC_0%,#4E85BF_100%)] transition-transform hover:scale-110 shrink-0"
          >
            <span className="w-full h-full rounded-full bg-bg flex items-center justify-center font-display italic text-[13px] text-text-primary">
              {site.monogram}
            </span>
          </a>
          <span className="w-px h-5 bg-stroke mx-1 hidden sm:block" />
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors text-muted hover:text-text-primary hover:bg-stroke/50"
            >
              {link.label}
            </Link>
          ))}
          <span className="w-px h-5 bg-stroke mx-1" />
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-muted hover:text-text-primary hover:bg-stroke/50 transition-colors"
            title="语言 / Language"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
          <SearchButton />
        </div>
      </nav>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="blur-in text-xs text-muted uppercase tracking-[0.3em] mb-8">{t('hero.eyebrow')}</p>
        <h1 className="name-reveal text-6xl md:text-8xl lg:text-9xl font-display italic leading-[0.9] tracking-tight text-text-primary mb-6">
          {site.heroTitle}
        </h1>
        <p className="blur-in text-base md:text-lg text-muted mb-2">
          {t('hero.rolePrefix')}{' '}
          <span key={topicIndex} className="font-display italic text-text-primary animate-role-fade-in inline-block">
            {topics[topicIndex]}
          </span>{' '}
          {t('hero.roleSuffix')}
        </p>
        <p className="blur-in text-sm md:text-base text-muted max-w-md mb-12">{t('hero.desc')}</p>
        <div className="blur-in inline-flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => scrollTo('about')}
            className="relative rounded-full text-sm px-7 py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary hover:scale-105 transition-all group"
          >
            <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity accent-gradient rounded-full" style={{ inset: '-2px', zIndex: -1 }} />
            {t('hero.start')}
          </button>
          <Link
            to="/posts"
            className="relative rounded-full text-sm px-7 py-3.5 border-2 border-stroke bg-bg text-text-primary hover:border-transparent hover:scale-105 transition-all group"
          >
            <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity accent-gradient rounded-full" style={{ inset: '-2px', zIndex: -1 }} />
            {t('hero.browse')}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex flex-col items-center gap-2 pb-8">
        <span className="text-xs text-muted uppercase tracking-[0.2em]">{t('hero.scroll')}</span>
        <div className="w-px h-10 bg-stroke overflow-hidden">
          <div className="w-px h-10 accent-gradient animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}
