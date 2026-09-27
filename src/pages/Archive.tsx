import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageNav from '../components/PageNav';
import { useLocale } from '../i18n';
import { themeClass, useTheme } from '../lib/theme';
import { FOLDERS, POSTS, UNCATEGORIZED, postPath } from '../lib/posts';
import { readCount, useProgress } from '../lib/progress';

// 文件夹完成度小圆环：读完变强调色
function Ring({ done, total }: { done: number; total: number }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  const p = total ? done / total : 0;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
      <title>{`${done}/${total}`}</title>
      <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2" className="text-muted opacity-30" stroke="currentColor" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        stroke="#4E85BF"
        strokeDasharray={`${c * p} ${c}`}
        transform="rotate(-90 8 8)"
        className="transition-all"
      />
    </svg>
  );
}

export default function Archive() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const [params, setParams] = useSearchParams();
  const folder = params.get('folder') ?? '';
  const tag = !folder ? params.get('tag') ?? '' : ''; // 文件夹优先；tag 只服务分类页/徽标链入
  const [open, setOpen] = useState<string[]>([]);
  useProgress(); // 订阅已读进度，标已读后圆环自动刷新

  const activeFolder = FOLDERS.find((f) => f.key === folder);
  const list = activeFolder
    ? activeFolder.posts
    : tag
      ? POSTS.filter((p) => p.tags.includes(tag))
      : POSTS;

  const toggle = (key: string) =>
    setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));

  const selectFolder = (key: string) => {
    setOpen((o) => (o.includes(key) ? o : [...o, key]));
    setParams({ folder: key });
  };

  const folderName = (key: string) =>
    key === UNCATEGORIZED
      ? t('arch.uncategorized')
      : (FOLDERS.find((f) => f.key === key)?.display ?? key);

  const pill = (on: boolean) =>
    `text-xs rounded-full px-4 py-2 border transition-colors whitespace-nowrap ${
      on ? 'bg-text-primary text-bg border-transparent' : 'border-stroke text-muted hover:text-text-primary'
    }`;

  const row = (on: boolean) =>
    `flex items-center gap-1 w-full text-left text-sm pl-2 pr-3 py-1.5 rounded-xl border-l-2 transition-colors ${
      on
        ? 'text-text-primary bg-stroke/50 border-[#4E85BF]'
        : 'text-muted border-transparent hover:text-text-primary hover:bg-stroke/30'
    }`;

  return (
    <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
      <PageNav />
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pt-28 md:pt-36 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-stroke" />
          <span className="text-xs text-muted uppercase tracking-[0.3em]">{t('arch.eyebrow')}</span>
        </div>
        <h1 className="text-4xl md:text-6xl text-text-primary mb-3">
          {t('arch.title')} <em className="font-display italic">{t('arch.italic')}</em>
        </h1>
        <p className="text-sm text-muted mb-8">{t('arch.sub')}</p>

        {/* 移动端：横滑文件夹 pills */}
        <div className="flex lg:hidden gap-2 mb-8 overflow-x-auto pb-1 -mx-6 px-6">
          <button onClick={() => setParams({})} className={pill(!folder && !tag)}>
            {t('arch.all')}
          </button>
          {FOLDERS.map((f) => (
            <button key={f.key} onClick={() => selectFolder(f.key)} className={pill(folder === f.key)}>
              {f.key === UNCATEGORIZED ? t('arch.uncategorized') : f.display} · {f.posts.length}
            </button>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:items-start">
          {/* 左侧悬浮目录卡片：默认全折叠 */}
          <aside className="hidden lg:block sticky top-28">
            <div className="bg-surface border border-stroke rounded-3xl p-4">
              <p className="text-xs text-muted uppercase tracking-[0.3em] px-3 pt-1 pb-3">
                {t('arch.folders')}
              </p>
              <div className="space-y-1">
                <button onClick={() => setParams({})} className={row(!folder && !tag)}>
                  <span className="flex-1 px-1">{t('arch.all')}</span>
                  <span className="text-[11px] text-muted bg-stroke/50 rounded-full px-2 py-0.5">
                    {POSTS.length}
                  </span>
                </button>
                {FOLDERS.map((f) => {
                  const isOpen = open.includes(f.key);
                  const isActive = folder === f.key;
                  const name = f.key === UNCATEGORIZED ? t('arch.uncategorized') : f.display;
                  return (
                    <div key={f.key}>
                      <div className={row(isActive)}>
                        <button
                          onClick={() => toggle(f.key)}
                          aria-label={isOpen ? 'collapse' : 'expand'}
                          className="px-1 text-muted hover:text-text-primary transition-transform"
                        >
                          <span className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                            ▸
                          </span>
                        </button>
                        <button onClick={() => selectFolder(f.key)} className="flex-1 text-left truncate">
                          {name}
                        </button>
                        <Ring done={readCount(f.posts)} total={f.posts.length} />
                        <span className="text-[11px] text-muted bg-stroke/50 rounded-full px-2 py-0.5">
                          {f.posts.length}
                        </span>
                      </div>
                      {isOpen && (
                        <ul className="ml-6 mt-1 space-y-0.5 border-l border-stroke pl-2">
                          {f.posts.map((p) => (
                            <li key={p.slug}>
                              <Link
                                to={postPath(p)}
                                className="block text-xs text-muted hover:text-text-primary truncate py-1 transition-colors"
                              >
                                {p.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <Link
                to="/notes"
                className="block text-xs text-muted hover:text-text-primary px-3 pt-3 transition-colors"
              >
                {t('post.allNotes')} →
              </Link>
            </div>
          </aside>

          {/* 右侧列表：一横行一张卡片 */}
          <div className="min-w-0">
            {(folder || tag) && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-text-primary">
                  {folder ? folderName(folder) : `#${tag}`}
                </span>
                <button
                  onClick={() => setParams({})}
                  className="text-xs text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {list.length === 0 && <p className="text-muted text-sm">{t('arch.empty')}</p>}
            <div className="grid grid-cols-1 gap-5 md:gap-6">
              {list.map((p, i) => (
                <motion.div
                  key={`${p.folder}/${p.slug}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: Math.min(i, 3) * 0.06 }}
                >
                  <Link
                    to={postPath(p)}
                    className="group block bg-surface border border-stroke rounded-3xl overflow-hidden"
                  >
                    {p.cover ? (
                      <div className="aspect-[16/7] md:aspect-[16/6] overflow-hidden">
                        <img src={p.cover} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="aspect-[16/7] md:aspect-[16/6] accent-gradient opacity-80" />
                    )}
                    <div className="p-5 md:p-6">
                      <p className="text-xs text-muted mb-2">
                        {p.date} · {p.minutes} {t('post.minRead')}
                      </p>
                      <h2 className="text-xl md:text-2xl text-text-primary font-medium mb-2 group-hover:underline underline-offset-4">
                        {p.title}
                      </h2>
                      <p className="text-sm text-muted line-clamp-2">{p.description}</p>
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {p.tags.map((tg) => (
                            <span key={tg} className="text-[11px] text-muted bg-stroke/50 rounded-full px-3 py-1">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
