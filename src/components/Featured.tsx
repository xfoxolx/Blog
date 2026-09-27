import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLocale } from '../i18n';
import { POSTS, postPath } from '../lib/posts';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const },
};

const SPANS = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];
const ASPECTS = [
  'aspect-[16/10] md:aspect-[16/9]',
  'aspect-[16/10] md:aspect-[4/3.4]',
  'aspect-[16/10] md:aspect-[4/3.4]',
  'aspect-[16/10] md:aspect-[16/9]',
];

export function SectionHeader({
  eyebrow,
  title,
  italic,
  sub,
  action,
  actionTo,
}: {
  eyebrow: string;
  title: string;
  italic: string;
  sub: string;
  action?: string;
  actionTo?: string;
}) {
  return (
    <motion.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-14">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-stroke" />
          <span className="text-xs text-muted uppercase tracking-[0.3em]">{eyebrow}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-body text-text-primary">
          {title} <em className="font-display italic">{italic}</em>
        </h2>
        <p className="text-sm text-muted mt-3">{sub}</p>
      </div>
      {action && (
      <Link to={actionTo ?? '/posts'} className="hidden md:inline-flex relative rounded-full text-sm px-6 py-3 text-text-primary group">
        <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity accent-gradient rounded-full" style={{ inset: '-2px' }} />
        <span className="relative bg-bg rounded-full px-2">
          {action} <span className="inline-block">→</span>
        </span>
      </Link>
      )}
    </motion.div>
  );
}

export default function Featured({ limit = 4, hideAction = false }: { limit?: number; hideAction?: boolean }) {
  const { t } = useLocale();
  const posts = POSTS.slice(0, limit);

  return (
    <section id="articles" className="bg-bg py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <SectionHeader
          eyebrow={t('featured.eyebrow')}
          title={t('featured.title')}
          italic={t('featured.italic')}
          sub={t('featured.sub')}
          action={hideAction ? undefined : t('featured.action')}
          actionTo="/featured"
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.slug}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 2) * 0.1 }}
              className={`${SPANS[i % 4]} group relative bg-surface border border-stroke rounded-3xl overflow-hidden`}
            >
              <Link to={postPath(post)}>
                <div className={`${ASPECTS[i % 4]} relative overflow-hidden`}>
                  {post.cover ? (
                    <img
                      src={post.cover}
                      alt={post.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 accent-gradient opacity-80" />
                  )}
                  <div
                    className="absolute inset-0 opacity-20 mix-blend-multiply"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                      backgroundSize: '4px 4px',
                    }}
                  />
                  <div className="absolute inset-0 bg-bg/70 opacity-0 group-hover:opacity-100 backdrop-blur-lg transition-opacity duration-500 flex items-center justify-center">
                    <span className="rounded-full p-[2px] accent-gradient animate-gradient-shift">
                      <span className="block bg-white text-black rounded-full px-6 py-3 text-sm">
                        {t('featured.read')} — <em className="font-display italic">{post.title}</em>
                      </span>
                    </span>
                  </div>
                </div>
                <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                  <h3 className="text-lg md:text-xl text-text-primary font-medium">{post.title}</h3>
                  <p className="text-xs text-muted whitespace-nowrap">
                    {post.minutes} {t('featured.minRead')} · {post.date}
                  </p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
