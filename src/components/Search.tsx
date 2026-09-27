import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n';
import { postPath, type Post } from '../lib/posts';
import { folderLabel, searchPosts } from '../lib/search';
import { SearchIcon } from './icons';

// 导航胶囊里的 ⌕ 按钮 + 全屏搜索浮层：⌘K/Ctrl+K 开关，↑↓ 回车导航，Esc 关闭
export default function SearchButton() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchPosts(q);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open ]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  const go = (p: Post) => {
    setOpen(false);
    navigate(postPath(p));
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => (results.length ? (s + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => (results.length ? (s - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[sel]) {
      go(results[sel]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="⌘K"
        className="flex items-center justify-center rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-muted hover:text-text-primary hover:bg-stroke/50 transition-colors"
      >
        <SearchIcon />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-24 md:pt-32"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stroke bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKey}
              placeholder={t('search.placeholder')}
              className="w-full border-b border-stroke bg-transparent px-5 py-4 text-sm text-text-primary placeholder:text-muted focus:outline-none"
            />
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto p-2">
                {results.map((p, i) => (
                  <li key={`${p.folder}/${p.slug}`}>
                    <button
                      onClick={() => go(p)}
                      onMouseEnter={() => setSel(i)}
                      className={`flex w-full items-baseline justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${
                        i === sel ? 'bg-stroke/50' : ''
                      }`}
                    >
                      <span className="truncate text-sm text-text-primary">{p.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {folderLabel(p, t('arch.uncategorized'))} · {p.date}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              q.trim() && (
                <p className="px-5 py-6 text-center text-sm text-muted">{t('search.empty')}</p>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
