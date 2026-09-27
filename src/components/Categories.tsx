import { Link } from 'react-router-dom';
import { useLocale } from '../i18n';
import { TAGS } from '../lib/posts';
import { SectionHeader } from './Featured';

export function CategoryPills() {
  return (
    <div className="flex flex-wrap gap-4">
      {TAGS.map(({ tag, count }) => (
        <Link
          key={tag}
          to={`/posts?tag=${tag}`}
          className="flex items-center gap-6 p-4 pl-6 bg-surface/30 hover:bg-surface border border-stroke rounded-[40px] sm:rounded-full transition-colors group"
        >
          <span className="text-muted group-hover:text-text-primary text-lg">#</span>
          <span className="text-text-primary text-base">{tag}</span>
          <span className="text-xs text-muted bg-stroke/50 rounded-full px-3 py-1">
            {count}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function Categories() {
  const { t } = useLocale();

  return (
    <section id="categories" className="bg-bg py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <SectionHeader
          eyebrow={t('cat.eyebrow')}
          title={t('cat.title')}
          italic={t('cat.italic')}
          sub={t('cat.sub')}
          action={t('cat.action')}
          actionTo="/categories"
        />
        <CategoryPills />
      </div>
    </section>
  );
}
