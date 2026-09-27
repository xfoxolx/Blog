import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../i18n';
import { useTheme } from '../lib/theme';
import SearchButton from './Search';
import { site } from '../data';
import { MoonIcon, SunIcon } from './icons';

/** 内容页共用浮动导航：首页胶囊同款 + 语言/日夜切换 */
export default function PageNav() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  const pill = (on: boolean) =>
    `text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${
      on ? 'text-text-primary bg-stroke/50' : 'text-muted hover:text-text-primary hover:bg-stroke/50'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div className="inline-flex items-center rounded-full liquid-glass px-2 py-2 shadow-md shadow-black/10">
        <Link
          to="/"
          className="w-9 h-9 rounded-full p-[2px] accent-gradient transition-transform hover:scale-110 shrink-0"
        >
          <span className="w-full h-full rounded-full bg-bg flex items-center justify-center font-display italic text-[13px] text-text-primary">
            {site.monogram}
          </span>
        </Link>
        <span className="w-px h-5 bg-stroke mx-1 hidden sm:block" />
        <Link to="/" className={pill(pathname === '/')}>
          {t('nav.home')}
        </Link>
        <Link to="/featured" className={pill(pathname === '/featured')}>
          {t('nav.featured')}
        </Link>
        <Link to="/categories" className={pill(pathname === '/categories')}>
          {t('nav.categories')}
        </Link>
        <Link to="/posts" className={pill(pathname.startsWith('/posts'))}>
          {t('nav.archive')}
        </Link>
        <span className="w-px h-5 bg-stroke mx-1" />
        <button onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')} className={pill(false)} title="语言 / Language">
          {locale === 'zh' ? 'EN' : '中文'}
        </button>
        <button onClick={toggle} className={`${pill(false)} flex items-center justify-center`} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <SearchButton />
      </div>
    </nav>
  );
}
