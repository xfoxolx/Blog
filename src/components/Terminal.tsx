import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useList, useLocale } from '../i18n';
import { useTheme } from '../lib/theme';
import { site } from '../data';
import { postPath, type Post } from '../lib/posts';
import { complete, displayPath, execute, type TermLine } from '../lib/terminal';

const MAX_LINES = 200;

// 全局命令终端：App 里挂一份，Ctrl+` 开关；历史只放内存，关掉即焚
export default function Terminal() {
  const { t, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const help = useList('terminal.help');
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [hi, setHi] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const prompt = `${site.name}@blog:${cwd ? displayPath(cwd) : '~'}$`;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.key !== '`') return;
      const el = e.target as HTMLElement | null;
      const ours = el === inputRef.current;
      const editable =
        !!el && !ours && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (editable) return; // 别处打字时的反引号不劫持
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setLines((l) => (l.length ? l : [{ kind: 'out', text: t('terminal.welcome') }]));
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, t]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines, open]);

  const run = (raw: string) => {
    const r = execute(raw, { cwd, results, t, help });
    setCwd(r.cwd);
    setResults(r.results);
    if (r.action?.type === 'clear') {
      setLines([]);
    } else {
      const echo: TermLine = { kind: 'cmd', text: `${prompt} ${raw}` };
      setLines((l) => [...l, echo, ...r.lines].slice(-MAX_LINES));
    }
    const a = r.action;
    if (!a) return;
    if (a.type === 'open') {
      setOpen(false);
      navigate(postPath(a.post));
    } else if (a.type === 'exit') {
      setOpen(false);
    } else if (a.type === 'theme') {
      if ((a.theme === 'dark') !== (theme === 'dark')) toggle();
    } else if (a.type === 'lang') {
      setLocale(a.lang);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const v = input;
      if (v.trim()) setHistory((h) => [...h.slice(-99), v]);
      setHi(null);
      setInput('');
      run(v);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const c = complete(input, cwd);
      setInput(c.text);
      if (c.list.length) {
        const cand: TermLine = { kind: 'out', text: c.list.join('   ') };
        setLines((l) => [...l, cand].slice(-MAX_LINES));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const ni = hi === null ? history.length - 1 : Math.max(0, hi - 1);
      setHi(ni);
      setInput(history[ni]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hi === null) return;
      const ni = hi + 1;
      if (ni >= history.length) {
        setHi(null);
        setInput('');
      } else {
        setHi(ni);
        setInput(history[ni]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-24 md:pt-32"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-stroke bg-surface shadow-2xl font-mono"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
      >
        <div ref={boxRef} className="max-h-[50vh] overflow-y-auto px-5 py-4 text-[13px] leading-6">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap break-words ${
                l.kind === 'cmd' ? 'text-text-primary' : l.kind === 'err' ? 'text-red-400' : 'text-muted'
              }`}
            >
              {l.text}
            </div>
          ))}
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-text-primary">{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHi(null);
              }}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="terminal"
              className="w-full bg-transparent text-sm text-text-primary caret-current focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
