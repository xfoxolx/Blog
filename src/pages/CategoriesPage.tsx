import { Link } from 'react-router-dom';
import PageNav from '../components/PageNav';
import { SectionHeader } from '../components/Featured';
import { CategoryPills } from '../components/Categories';
import { useLocale } from '../i18n';
import { themeClass, useTheme } from '../lib/theme';
import { POSTS, TAGS, postPath } from '../lib/posts';

export default function CategoriesPage() {
  const { t } = useLocale();
  const { theme } = useTheme();

  return (
    <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
      <PageNav />
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pt-28 md:pt-36 pb-20">
        <SectionHeader
          eyebrow={t('cat.eyebrow')}
          title={t('cat.title')}
          italic={t('cat.italic')}
          sub={t('cat.sub')}
        />
        <CategoryPills />
        <div className="mt-12 space-y-8">
          {TAGS.map(({ tag, count }) => {
            const list = POSTS.filter((p) => p.tags.includes(tag));
            return (
              <section key={tag} className="bg-surface border border-stroke rounded-3xl p-5 md:p-7">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-muted text-lg">#</span>
                  <h2 className="text-xl md:text-2xl text-text-primary">{tag}</h2>
                  <span className="text-xs text-muted bg-stroke/50 rounded-full px-3 py-1">
                    {count}
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-muted py-2">{t('arch.empty')}</p>
                ) : (
                  <ul className="divide-y divide-stroke">
                    {list.map((p) => (
                      <li key={p.slug}>
                        <Link
                          to={postPath(p)}
                          className="flex items-baseline justify-between gap-4 py-3 group"
                        >
                          <span className="text-text-primary group-hover:underline underline-offset-4">
                            {p.title}
                          </span>
                          <span className="text-xs text-muted whitespace-nowrap">
                            {p.date} · {p.minutes} {t('post.minRead')}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
