import { useEffect, useMemo, useRef, useState, isValidElement, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import PageNav from '../components/PageNav';
import Mermaid from '../components/Mermaid';
import CodeBlock, { type HastLike } from '../components/CodeBlock';
import { TocList, useToc } from '../components/Toc';
import ArticleNotes from '../components/ArticleNotes';
import { useLocale } from '../i18n';
import { themeClass, useTheme } from '../lib/theme';
import { getPost, postPath, siblings, FOLDERS } from '../lib/posts';
import { isRead, markRead, useProgress } from '../lib/progress';
import { FOCUS_SIZES, FOCUS_WIDTHS, SERIF_STACK, loadFocus, saveFocus, type FocusPrefs } from '../lib/focus';

function isMermaid(el: unknown) {
  const props = (el as ReactElement)?.props as { className?: string; children?: unknown } | undefined;
  return typeof props?.className === 'string' && props.className.includes('language-mermaid')
    ? String(props.children ?? '')
    : null;
}

export default function Post() {
  const { folder, slug } = useParams();
  const { t } = useLocale();
  const { theme } = useTheme();
  const articleRef = useRef<HTMLElement>(null);
  const post = getPost(folder, slug);
  const { items, active } = useToc(articleRef, `${folder}/${slug}`);
  const [focus, setFocus] = useState(false);
  const [prefs, setPrefs] = useState(loadFocus);
  const setPref = (p: Partial<FocusPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      saveFocus(next);
      return next;
    });
  };
  const fbtn =
    'text-xs rounded-full px-3 py-1.5 transition-colors text-muted hover:text-text-primary hover:bg-stroke/50';
  // 专注态所有内容块共用同一列宽，正文、笔记、上下篇左对齐
  const focusWidth = FOCUS_WIDTHS[prefs.width];

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus]);

  useProgress(); // 订阅已读进度，标已读后“还剩 N 篇”与圆环自动刷新
  const trackerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trackerRef.current;
    if (!el || !post) return;
    if (isRead(post.folder, post.slug)) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          markRead(post.folder, post.slug);
          ob.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [post?.folder, post?.slug]);

  // components 对象提到 useMemo 且放在 early return 之前：
  // 目录高亮 setState 会让 Post 重渲染，不 memo 的话整篇 Markdown 每次跟着重 diff，
  // 是滚动抖动的主凶之一；放 return 之后则违反 Hooks 规则
  const mdComponents = useMemo(
    () => ({
      pre({ children, node }: { children?: React.ReactNode; node?: HastLike }) {
        const child = Array.isArray(children) ? children[0] : children;
        const code = isMermaid(child);
        if (code !== null) return <Mermaid code={code} />;
        const codeNode = node?.children?.find((c) => c.tagName === 'code');
        if (isValidElement(child)) return <CodeBlock codeEl={child} codeNode={codeNode} />;
        return <pre>{children}</pre>;
      },
      table({ children }: { children?: React.ReactNode }) {
        return (
          <div className="overflow-x-auto rounded-2xl border border-stroke">
            <table>{children}</table>
          </div>
        );
      },
      a({
        href,
        children,
        node: _node,
        ...rest
      }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        node?: HastLike;
      }) {
        const external = href?.startsWith('http');
        // ponytail: HashRouter 会把页内 #锚点当路由吃掉（* 兜底跳首页），
        // 同页锚点（脚注回跳、标题自链）一律拦截改走 scrollIntoView；
        // 多路解析目标：防插件改 id 前缀/编码后对不上就静默失败
        if (href?.startsWith('#')) {
          return (
            <a
              href={href}
              {...rest}
              onClick={(e) => {
                e.preventDefault();
                const raw = href.slice(1);
                const target =
                  document.getElementById(raw) ??
                  document.getElementById(decodeURIComponent(raw)) ??
                  document.getElementById(raw.replace(/^user-content-/, ''));
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 到达反馈：目标已在视口内时浏览器不会滚动（比如文末脚注回跳），
                // 闪一下让眼睛落到引用处
                if (target instanceof HTMLElement) {
                  target.classList.remove('fn-flash');
                  void target.offsetWidth;
                  target.classList.add('fn-flash');
                  window.setTimeout(() => target.classList.remove('fn-flash'), 1600);
                }
              }}
            >
              {children}
            </a>
          );
        }
        return (
          <a href={href} {...rest} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
            {children}
          </a>
        );
      },
      img({ src, alt }: { src?: string; alt?: string }) {
        // 懒加载 + 异步解码：正文图片晚到是底部跳动的另一大来源
        return <img src={src} alt={alt} loading="lazy" decoding="async" className="rounded-2xl" />;
      },
    }),
    []
  );

  if (!post) {
    return (
      <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
        <PageNav />
        <div className="max-w-[720px] mx-auto px-6 pt-40 pb-20 text-center">
          <p className="font-display italic text-3xl mb-6">404</p>
          <p className="text-muted text-sm mb-8">{t('post.notFound')}</p>
          <Link to="/posts" className="text-sm px-7 py-3.5 rounded-full bg-text-primary text-bg">
            {t('post.back')}
          </Link>
        </div>
      </main>
    );
  }

  const { prev, next } = siblings(post.folder, post.slug);
  const single = !prev || prev.slug === post.slug;
  const folderPosts = FOLDERS.find((f) => f.key === post.folder)?.posts ?? [];
  const remaining = folderPosts.filter((p) => p.slug !== post.slug && !isRead(p.folder, p.slug)).length;
  const nextUnread = (() => {
    const i = folderPosts.findIndex((p) => p.slug === post.slug);
    for (let k = 1; k <= folderPosts.length; k++) {
      const p = folderPosts[(i + k) % folderPosts.length];
      if (p.slug !== post.slug && !isRead(p.folder, p.slug)) return p;
    }
    return undefined;
  })();

  return (
    <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
      {focus ? null : <PageNav />}
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pt-28 md:pt-36 pb-20">
        <div className="flex items-center justify-between gap-4">
          <Link to="/posts" className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em]">
            ← {t('post.back')}
          </Link>
          {focus ? null : (
            <button
              onClick={() => setFocus(true)}
              className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
            >
              {t('post.focus')}
            </button>
          )}
        </div>

        <header
          className={focus ? 'mt-8 mb-8 mx-auto w-full' : 'max-w-[760px] mt-8 mb-8'}
          style={focus ? { maxWidth: focusWidth } : undefined}
        >
          <p className="text-xs text-muted mb-4">
            {post.date} · {post.minutes} {t('post.minRead')}
          </p>
          <h1 className="font-display italic text-4xl md:text-6xl leading-[1.05] tracking-tight mb-4">
            {post.title}
          </h1>
          {post.description && <p className="text-sm md:text-base text-muted">{post.description}</p>}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {post.tags.map((tg) => (
                <Link
                  key={tg}
                  to={`/posts?tag=${tg}`}
                  className="text-[11px] text-muted bg-stroke/50 hover:text-text-primary rounded-full px-3 py-1 transition-colors"
                >
                  {tg}
                </Link>
              ))}
            </div>
          )}
        </header>

        {post.cover && (
          <img src={post.cover} alt={post.title} className="w-full aspect-[2/1] max-h-[420px] object-cover rounded-3xl border border-stroke mb-10" />
        )}

        {/* 移动端折叠目录（零 JS 状态，用 details） */}
{focus ? null : items.length > 0 && (
          <details className="lg:hidden mb-8 rounded-2xl border border-stroke bg-surface px-5 py-4">
            <summary className="text-xs text-muted uppercase tracking-[0.3em] cursor-pointer">
              {t('post.toc')}
            </summary>
            <div className="mt-3">
              <TocList items={items} active={active} />
            </div>
          </details>
        )}

        <div className={focus ? 'flex justify-center' : 'grid grid-cols-1 lg:grid-cols-[minmax(0,760px)_240px] gap-12 justify-between'}>
          <article
            ref={articleRef}
            className={`prose prose-lg max-w-none min-w-0${focus ? ' w-full' : ''}`}
            style={
              focus
                ? {
                    fontSize: FOCUS_SIZES[prefs.size],
                    maxWidth: focusWidth,
                    fontFamily: prefs.serif ? SERIF_STACK : undefined,
                  }
                : undefined
            }
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkAlert]}
              rehypePlugins={[rehypeSlug, rehypeHighlight]}
              components={mdComponents}
            >
              {post.body}
            </ReactMarkdown>
          </article>

{focus ? null : items.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs text-muted uppercase tracking-[0.3em] mb-4">{t('post.toc')}</p>
                <TocList items={items} active={active} />
              </div>
            </aside>
          )}
        </div>

        <div
          className={focus ? 'mt-12 mx-auto w-full' : 'max-w-[760px] mt-12'}
          style={focus ? { maxWidth: focusWidth } : undefined}
        >
          <ArticleNotes articleKey={`${post.folder}/${post.slug}`} articleRef={articleRef} />
        </div>

        {focus ? (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="liquid-glass rounded-full px-2 py-1.5 flex items-center gap-0.5 shadow-lg">
              <button onClick={() => setFocus(false)} className={fbtn}>
                {t('post.exitFocus')}
              </button>
              <span className="w-px h-4 bg-stroke mx-1" />
              <button onClick={() => setPref({ size: Math.max(0, prefs.size - 1) })} className={fbtn} aria-label="A-">
                A−
              </button>
              <button
                onClick={() => setPref({ size: Math.min(FOCUS_SIZES.length - 1, prefs.size + 1) })}
                className={fbtn}
                aria-label="A+"
              >
                A+
              </button>
              <span className="w-px h-4 bg-stroke mx-1" />
              {[t('post.wNarrow'), t('post.wNormal'), t('post.wWide')].map((label, i) => (
                <button
                  key={label}
                  onClick={() => setPref({ width: i })}
                  className={`${fbtn}${prefs.width === i ? ' text-text-primary bg-stroke/50' : ''}`}
                >
                  {label}
                </button>
              ))}
              <span className="w-px h-4 bg-stroke mx-1" />
              <button
                onClick={() => setPref({ serif: !prefs.serif })}
                className={`${fbtn}${prefs.serif ? ' text-text-primary bg-stroke/50' : ''}`}
              >
                {t('post.serif')}
              </button>
            </div>
          </div>
        ) : null}

        <div ref={trackerRef} aria-hidden className="h-px" />

        {!single && (
        <nav
          className={focus ? 'grid sm:grid-cols-2 gap-4 mt-16 mx-auto w-full' : 'grid sm:grid-cols-2 gap-4 mt-16 max-w-[760px]'}
          style={focus ? { maxWidth: focusWidth } : undefined}
        >
          <Link to={postPath(prev!)} className="rounded-2xl border border-stroke bg-surface p-5 hover:bg-stroke/30 transition-colors">
            <p className="text-[11px] text-muted uppercase tracking-[0.2em] mb-1">← {t('post.prev')}</p>
            <p className="text-text-primary">{prev!.title}</p>
          </Link>
          <Link to={postPath(next!)} className="rounded-2xl border border-stroke bg-surface p-5 text-right hover:bg-stroke/30 transition-colors">
            <p className="text-[11px] text-muted uppercase tracking-[0.2em] mb-1">{t('post.next')} →</p>
            <p className="text-text-primary">{next!.title}</p>
          </Link>
        </nav>
        )}
        {folderPosts.length > 1 && (
          <div
            className={
              focus
                ? 'mt-6 mx-auto w-full flex items-center justify-between gap-4 text-xs text-muted'
                : 'mt-6 max-w-[760px] flex items-center justify-between gap-4 text-xs text-muted'
            }
            style={focus ? { maxWidth: focusWidth } : undefined}
          >
            {remaining > 0 ? (
              <span>
                {t('post.remainingPre')}
                {remaining}
                {t('post.remainingSuf')}
              </span>
            ) : (
              <span>{t('post.groupDone')}</span>
            )}
            {nextUnread && (
              <Link to={postPath(nextUnread)} className="shrink-0 hover:text-text-primary transition-colors">
                {t('post.next')}：{nextUnread.title} →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
