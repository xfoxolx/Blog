import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from './Featured';
import { useList, useLocale } from '../i18n';
import { POSTS, TAGS } from '../lib/posts';
import { site } from '../data';

const STACK = site.stack;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
};

function YearProgress() {
  const { t } = useLocale();
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const pct = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
  // ponytail: whole-day granularity, no timer — re-renders on nav anyway
  const elapsed = Math.floor((now.getTime() - start) / 86400000);
  const left = Math.max(0, Math.ceil((end - now.getTime()) / 86400000));
  // 彩蛋：600ms 内连点三次翻面，再连点三次翻回
  const [flipped, setFlipped] = useState(false);
  const taps = useRef(0);
  const tapTimer = useRef<number | undefined>(undefined);
  const quotes = useList('about.quotes');
  const quote = quotes.length ? quotes[elapsed % quotes.length] : '';
  const onCardClick = () => {
    taps.current += 1;
    window.clearTimeout(tapTimer.current);
    if (taps.current >= 3) {
      taps.current = 0;
      setFlipped((f) => !f);
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 600);
  };

  return (
    <motion.div {...fadeUp} className="mt-5 md:mt-6" style={{ perspective: 1200 }}>
      <div
        onClick={onCardClick}
        className="relative cursor-pointer select-none"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.25,0.1,0.25,1)',
          transform: flipped ? 'rotateY(180deg)' : 'none',
        }}
      >
        <div
          className="bg-surface border border-stroke rounded-3xl p-6 md:p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-muted uppercase tracking-[0.3em] mb-4">
            {t('about.year')} · {year}
          </p>
          <p className="font-display italic text-4xl md:text-5xl text-text-primary mb-4">
            {pct.toFixed(1)}%
          </p>
          <div className="h-2 rounded-full bg-stroke/50 overflow-hidden mb-4">
            <div className="h-full rounded-full accent-gradient" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>
              {t('about.elapsed')} {elapsed} {t('about.days')}
            </span>
            <span>
              {t('about.remaining')} {left} {t('about.days')}
            </span>
          </div>
        </div>
        <div
          className="absolute inset-0 bg-surface border border-stroke rounded-3xl p-6 md:p-8 flex flex-col justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-muted uppercase tracking-[0.3em] mb-4">
            {t('about.wisdom')} · {year}
          </p>
          <p className="font-display italic text-2xl md:text-3xl text-text-primary leading-snug">
            {quote}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function About() {
  const { t } = useLocale();
  const stats = [
    { value: String(POSTS.length), label: t('about.articles') },
    { value: String(TAGS.length), label: t('about.tags') },
  ];

  return (
    <section id="about" className="bg-bg py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <SectionHeader
          eyebrow={t('about.eyebrow')}
          title={t('about.title')}
          italic={t('about.italic')}
          sub={t('about.bio')}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* 左：头像卡 */}
          <motion.div
            {...fadeUp}
            className="lg:col-span-4 bg-surface border border-stroke rounded-3xl p-8 flex flex-col items-center text-center"
          >
            <div className="w-28 h-28 rounded-full p-[3px] accent-gradient mb-5">
              <img
                src={`${import.meta.env.BASE_URL}${site.avatar}`}
                alt={site.name}
                loading="lazy"
                className="w-full h-full rounded-full object-cover bg-bg"
              />
            </div>
            <p className="font-display italic text-2xl text-text-primary mb-2">{site.name}</p>
            <p className="text-xs text-muted uppercase tracking-[0.3em] mb-6">{site.role}</p>
            <div className="flex items-center gap-5 mb-8">
              <a
                href={`https://github.com/${site.githubUser}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
              >
                GitHub
              </a>
              <a
                href={`mailto:${site.email}`}
                className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
              >
                Email
              </a>
            </div>
            <a
              href={`mailto:${site.email}`}
              className="relative rounded-full text-sm px-7 py-3 bg-text-primary text-bg hover:scale-105 transition-transform group"
            >
              <span
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity accent-gradient rounded-full"
                style={{ inset: '-2px', zIndex: -1 }}
              />
              {t('about.contact')} ↗
            </a>
          </motion.div>

          {/* 右：数字 + 热力图 + 技术栈 */}
          <div className="lg:col-span-8 flex flex-col gap-5 md:gap-6">
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-5 md:gap-6">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-surface border border-stroke rounded-3xl py-6 px-4 text-center"
                >
                  <p className="font-display italic text-4xl md:text-5xl text-text-primary mb-1">
                    {s.value}
                  </p>
                  <p className="text-[11px] md:text-xs text-muted">{s.label}</p>
                </div>
              ))}
            </motion.div>

            {site.heatmapColor ? (
            <motion.div {...fadeUp} className="bg-surface border border-stroke rounded-3xl p-6 md:p-8">
              <p className="text-xs text-muted uppercase tracking-[0.3em] mb-4">
                {t('about.heatmap')}
              </p>
              <a href={`https://github.com/${site.githubUser}`} target="_blank" rel="noreferrer" className="block">
                <img
                  src={`https://ghchart.rshah.org/${site.heatmapColor}/${site.githubUser}`}
                  alt="GitHub contributions"
                  loading="lazy"
                  className="w-full h-auto"
                />
              </a>
            </motion.div>
            ) : null}

            <motion.div {...fadeUp} className="bg-surface border border-stroke rounded-3xl p-6 md:p-8">
              <p className="text-xs text-muted uppercase tracking-[0.3em] mb-4">
                {t('about.stack')}
              </p>
              <div className="flex flex-wrap gap-2">
                {STACK.map((s) => (
                  <span
                    key={s}
                    className="text-xs text-muted bg-stroke/50 rounded-full px-4 py-2"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        <YearProgress />
      </div>
    </section>
  );
}
