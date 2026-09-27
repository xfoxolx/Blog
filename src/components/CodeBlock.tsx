import { useState, type ReactElement } from 'react';
import { useLocale } from '../i18n';

// hast 最小结构：只为读 className / data.meta / 扒文本行数，不引 hast 包
export interface HastLike {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: { className?: unknown };
  data?: { meta?: unknown };
  children?: HastLike[];
}

function hastText(node: HastLike | HastLike[] | string | undefined): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(hastText).join('');
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.value ?? '';
  return hastText(node.children);
}

function cls(node?: HastLike): string {
  const c = node?.properties?.className;
  return Array.isArray(c) ? c.join(' ') : String(c ?? '');
}

// 文件名：meta 的 title="x" 优先，其次语言后缀 ts:x
function fileOf(lang: string, meta: unknown): { lang: string; file: string } {
  let file = '';
  if (typeof meta === 'string') {
    file = /(?:title|filename|name)=["']?([^"'\s]+)["']?/.exec(meta)?.[1] ?? '';
  }
  let l = lang;
  const i = lang.indexOf(':');
  if (i > 0) {
    if (!file) file = lang.slice(i + 1);
    l = lang.slice(0, i);
  }
  return { lang: l, file };
}

export default function CodeBlock({
  codeEl,
  codeNode,
}: {
  codeEl: ReactElement;
  codeNode?: HastLike;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const m = /language-([\w:.-]+)/.exec(cls(codeNode));
  const { lang, file } = fileOf(m?.[1] ?? '', codeNode?.data?.meta);
  const label = file || lang || 'text';
  // ponytail: 行号走独立 gutter，不拆 highlight 的 span，天然对齐
  const text = hastText(codeNode?.children).replace(/\n$/, '');
  const count = text.split('\n').length;

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 非安全上下文 fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-stroke">
      <div className="flex items-center gap-2 border-b border-stroke bg-surface px-4 py-2.5">
        <span className="truncate font-mono text-xs text-muted">{label}</span>
        {lang && (
          <span className="ml-auto rounded-full bg-stroke/50 px-2 py-0.5 font-mono text-[11px] text-muted">
            {lang}
          </span>
        )}
        <button
          onClick={doCopy}
          aria-label={t('post.copy')}
          title={copied ? t('post.copied') : t('post.copy')}
          className="rounded-full p-1 text-muted transition-colors hover:bg-stroke/50 hover:text-text-primary"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? t('post.collapse') : t('post.expand')}
          title={open ? t('post.collapse') : t('post.expand')}
          className="rounded-full p-1 text-muted transition-colors hover:bg-stroke/50 hover:text-text-primary"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${open ? '' : '-rotate-90'}`}
          >
            <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="overflow-x-auto bg-[hsl(var(--surface))]">
          <div className="flex w-max min-w-full font-mono text-[13px] leading-6 text-text-primary">
            <div aria-hidden className="sticky left-0 select-none bg-[hsl(var(--surface))] py-4 pl-4 pr-3 text-right text-muted/60">
              {Array.from({ length: count }, (_, i) => (
                <span key={i} className="block">
                  {i + 1}
                </span>
              ))}
            </div>
            <pre className="m-0 flex-1 border-0 bg-transparent p-0 py-4 pl-4 pr-6">{codeEl}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
