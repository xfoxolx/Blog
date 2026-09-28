import { useEffect, useState, type RefObject } from 'react';

interface Item {
  id: string;
  text: string;
  level: number;
}

/** 目录从渲染后的 DOM 提取：ID 与 rehype-slug 天然一致，零依赖。 */
export function useToc(target: RefObject<HTMLElement | null>, depKey: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const root = target.current;
    if (!root) return;
    const els = [...root.querySelectorAll('h2[id], h3[id]')];
    setItems(els.map((el) => ({ id: el.id, text: el.textContent ?? '', level: el.tagName === 'H2' ? 2 : 3 })));
    // rAF 节流 + 相等守卫：滚动时 observer 高频触发，不能每次都 setState
    // 否则整篇 ReactMarkdown 跟着重 diff，低端机上就是闪
    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (!vis.length) return;
        const id = vis[vis.length - 1].target.id;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setActive((prev) => (prev === id ? prev : id)));
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [depKey, target]);

  return { items, active };
}

export function TocList({ items, active }: { items: Item[]; active: string }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((it) => (
        <li key={it.id} className={it.level === 3 ? 'pl-4' : ''}>
          <button
            onClick={() => document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`block w-full text-left py-1 px-3 rounded-full transition-colors border-l-2 ${
              active === it.id
                ? 'text-text-primary border-[#4E85BF]'
                : 'text-muted border-transparent hover:text-text-primary'
            }`}
          >
            {it.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
