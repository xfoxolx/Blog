import { useEffect, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../i18n';
import { clearNotes, listNotes, removeNote, saveNote, useNotes } from '../lib/notes';

interface Props {
  articleKey: string;
  articleRef: RefObject<HTMLElement | null>;
}

interface HLRegistry {
  set(name: string, hl: unknown): void;
  delete(name: string): void;
}

// 跨文本节点找原文：拼全文搜下标，再映射回 node/offset，
// 划线横跨 <strong>/<code> 等行内元素时也能定位
function findRanges(root: HTMLElement, query: string): Range[] {
  if (!query) return [];
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    if (n.textContent) nodes.push(n as Text);
    n = walker.nextNode();
  }
  const full = nodes.map((x) => x.textContent ?? '').join('');
  const ranges: Range[] = [];
  let from = 0;
  while (ranges.length < 50) {
    const i = full.indexOf(query, from);
    if (i < 0) break;
    const stop = i + query.length;
    let acc = 0;
    let start: { node: Text; offset: number } | null = null;
    let end: { node: Text; offset: number } | null = null;
    for (const node of nodes) {
      const len = (node.textContent ?? '').length;
      if (!start && i < acc + len) start = { node, offset: i - acc };
      if (start && stop <= acc + len) {
        end = { node, offset: stop - acc };
        break;
      }
      acc += len;
    }
    if (start && end) {
      const r = document.createRange();
      r.setStart(start.node, start.offset);
      r.setEnd(end.node, end.offset);
      ranges.push(r);
    }
    from = stop;
  }
  return ranges;
}

function scrollToRange(r: Range) {
  let el: Node | null = r.startContainer;
  while (el && el.nodeType !== Node.ELEMENT_NODE) el = el.parentNode;
  (el as Element | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

const btn =
  'rounded-full px-3 py-1 text-xs text-muted hover:text-text-primary hover:bg-stroke/50 transition-colors';

export default function ArticleNotes({ articleKey, articleRef }: Props) {
  const { t, locale } = useLocale();
  const v = useNotes();
  const notes = listNotes(articleKey);
  const [pending, setPending] = useState<{ text: string; x: number; y: number } | null>(null);
  const [stale, setStale] = useState<Record<string, boolean>>({});

  // 选区变化即收录候选：只认 article 内的有效选区，点保存前原文不动
  useEffect(() => {
    const onChange = () => {
      const root = articleRef.current;
      const sel = document.getSelection();
      if (!root || !sel || sel.isCollapsed || !sel.anchorNode || !sel.focusNode) {
        setPending(null);
        return;
      }
      if (!root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) {
        setPending(null);
        return;
      }
      const text = sel.toString();
      if (text.trim().length < 2) {
        setPending(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setPending(null);
        return;
      }
      setPending({
        text,
        x: Math.min(Math.max(rect.left + rect.width / 2, 72), window.innerWidth - 72),
        y: Math.max(rect.top, 8),
      });
    };
    document.addEventListener('selectionchange', onChange);
    return () => document.removeEventListener('selectionchange', onChange);
  }, [articleKey, articleRef]);

  // 已存划线用 Custom Highlight 上色：零 DOM 改动，和 ReactMarkdown 共存；
  // 不支持的浏览器静默降级，只剩下面的列表
  useEffect(() => {
    const root = articleRef.current;
    // SAFETY: Highlight is progressive enhancement; H is checked for existence before use below.
    const H = (window as unknown as { Highlight?: new (...r: Range[]) => object }).Highlight;
    // SAFETY: CSS.highlights may not exist; reg is checked for existence before use below.
    const reg = (CSS as unknown as { highlights?: HLRegistry }).highlights;
    if (!root || !H || !reg) {
      setStale({});
      return;
    }
    const miss: Record<string, boolean> = {};
    const ranges: Range[] = [];
    for (const note of listNotes(articleKey)) {
      const found = findRanges(root, note.text);
      if (!found.length) miss[note.id] = true;
      ranges.push(...found.slice(0, 20));
    }
    try {
      reg.set('article-note', new H(...ranges));
    } catch {
      // range 失效就当没渲染，不炸
    }
    setStale(miss);
    return () => {
      try {
        reg.delete('article-note');
      } catch {
        // 卸载时注册表没了也无所谓
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleKey, v]);

  const doSave = () => {
    if (!pending) return;
    saveNote(articleKey, pending.text);
    document.getSelection()?.removeAllRanges();
    setPending(null);
  };

  const doCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 剪贴板拒绝就这次不复制，不炸
    }
  };

  const doJump = (text: string) => {
    const root = articleRef.current;
    if (!root) return;
    const r = findRanges(root, text)[0];
    if (r) scrollToRange(r);
  };

  return (
    <div>
      {pending && (
        <button
          onClick={doSave}
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-full bg-text-primary text-bg text-xs px-4 py-2 shadow-lg hover:scale-105 transition-transform"
          style={{ left: pending.x, top: pending.y - 8 }}
        >
          {t('post.saveNote')}
        </button>
      )}
      <div className="rounded-2xl border border-stroke bg-surface p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] text-muted uppercase tracking-[0.2em]">
            {t('post.notes')} · {notes.length} {t('post.notesUnit')}
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/notes" className={btn}>
              {t('post.allNotes')} →
            </Link>
            {notes.length > 0 && (
              <button onClick={() => clearNotes(articleKey)} className={btn}>
                {t('post.clearNotes')}
              </button>
            )}
          </div>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-muted">{t('post.noteEmpty')}</p>
        ) : (
          <ul className="divide-y divide-stroke">
            {notes.map((n) => (
              <li key={n.id} className="py-3">
                <p className="text-sm text-text-primary line-clamp-3">{n.text}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  <span>
                    {new Date(n.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                  {stale[n.id] && <span>· {t('post.staleNote')}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {!stale[n.id] && (
                      <button onClick={() => doJump(n.text)} className={btn}>
                        {t('post.jump')}
                      </button>
                    )}
                    <button onClick={() => void doCopy(n.text)} className={btn}>
                      {t('post.copyText')}
                    </button>
                    <button onClick={() => removeNote(articleKey, n.id)} className={btn}>
                      {t('post.removeNote')}
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
