import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageNav from '../components/PageNav';
import { useLocale } from '../i18n';
import { themeClass, useTheme } from '../lib/theme';
import { getPost, postPath } from '../lib/posts';
import {
  clearNotes,
  exportNotes,
  importNotes,
  listAllNotes,
  removeNote,
  useNotes,
  type Note,
} from '../lib/notes';

const btn =
  'rounded-full px-4 py-2 text-xs text-muted border border-stroke hover:text-text-primary hover:bg-stroke/30 transition-colors';
const rowBtn =
  'rounded-full px-3 py-1 text-xs text-muted hover:text-text-primary hover:bg-stroke/50 transition-colors';

interface Group {
  key: string;
  title: string;
  href?: string;
  orphan: boolean;
  notes: Note[];
}

// 全局唯一出入口：统一导出/导入；文章删了笔记不丢，进“原文已删除”归档，恢复后自动回来
export default function Notes() {
  const { t, locale } = useLocale();
  const { theme } = useTheme();
  useNotes();
  const [importError, setImportError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups: Group[] = [];
  {
    const all = listAllNotes();
    for (const key of Object.keys(all)) {
      const notes = all[key];
      if (!notes.length) continue;
      const sep = key.split('/');
      const post = sep.length === 2 ? getPost(sep[0], sep[1]) : undefined;
      groups.push({
        key,
        title: post ? post.title : key,
        href: post ? postPath(post) : undefined,
        orphan: !post,
        notes: [...notes].sort((a, b) => b.createdAt - a.createdAt),
      });
    }
    const latest = (g: Group) => Math.max(...g.notes.map((n) => n.createdAt));
    // 有效文章按最新划线倒序，已删除的沉底
    groups.sort((a, b) => Number(a.orphan) - Number(b.orphan) || latest(b) - latest(a));
  }
  const total = groups.reduce((s, g) => s + g.notes.length, 0);

  const doExport = () => {
    const blob = new Blob([exportNotes()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-notes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImportFile = async (f: File | undefined) => {
    if (!f) return;
    setImportError(false);
    try {
      importNotes(await f.text());
    } catch {
      setImportError(true);
    }
  };

  const doCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 剪贴板拒绝就这次不复制，不炸
    }
  };

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');

  return (
    <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
      <PageNav />
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pt-28 md:pt-36 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-stroke" />
          <span className="text-xs text-muted uppercase tracking-[0.3em]">{t('notes.eyebrow')}</span>
        </div>
        <h1 className="text-4xl md:text-6xl text-text-primary mb-3">
          {t('notes.title')} <em className="font-display italic">{t('notes.italic')}</em>
        </h1>
        <p className="text-sm text-muted mb-8">{t('notes.sub')}</p>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          <button onClick={doExport} className={btn}>
            {t('post.exportNotes')}
          </button>
          <button onClick={() => fileRef.current?.click()} className={btn}>
            {t('post.importNotes')}
          </button>
          <span className="text-xs text-muted ml-1">
            {t('post.notes')} · {total} {t('post.notesUnit')}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void doImportFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {importError && <p className="text-xs text-red-400 mb-4">{t('post.importError')}</p>}

        {groups.length === 0 ? (
          <div>
            <p className="text-sm text-muted mb-4">{t('notes.empty')}</p>
            <Link
              to="/posts"
              className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
            >
              ← {t('post.back')}
            </Link>
          </div>
        ) : (
          <div className="max-w-[760px]">
            {groups.map((g) => (
              <section key={g.key} className="rounded-2xl border border-stroke bg-surface p-5 mb-5">
                <div className="flex items-center gap-2 mb-1">
                  {g.href ? (
                    <Link
                      to={g.href}
                      className="text-text-primary font-medium hover:underline underline-offset-4 truncate"
                    >
                      {g.title}
                    </Link>
                  ) : (
                    <span className="text-text-primary font-medium break-all">{g.title}</span>
                  )}
                  {g.orphan && (
                    <span className="shrink-0 text-[11px] text-muted bg-stroke/50 rounded-full px-2 py-0.5">
                      {t('notes.orphan')}
                    </span>
                  )}
                  <button onClick={() => clearNotes(g.key)} className={`${rowBtn} ml-auto shrink-0`}>
                    {t('post.clearNotes')}
                  </button>
                </div>
                <ul className="divide-y divide-stroke">
                  {g.notes.map((n) => (
                    <li key={n.id} className="py-3">
                      <p className="text-sm text-text-primary line-clamp-3">{n.text}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                        <span>{fmt(n.createdAt)}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <button onClick={() => void doCopy(n.text)} className={rowBtn}>
                            {t('post.copyText')}
                          </button>
                          <button onClick={() => removeNote(g.key, n.id)} className={rowBtn}>
                            {t('post.removeNote')}
                          </button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
