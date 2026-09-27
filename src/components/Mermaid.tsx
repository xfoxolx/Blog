import { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../lib/theme';

export default function Mermaid({ code }: { code: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boxRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let alive = true;
    const box = boxRef.current;
    mermaid.initialize({ startOnLoad: false, theme: theme === 'light' ? 'default' : 'dark' });
    mermaid
      .render(`mm-${rawId}`, code)
      .then(({ svg }) => {
        if (!alive || !box) return;
        // 白名单：只接受解析后根节点确为 <svg> 的输出
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        const node = doc.documentElement;
        box.replaceChildren();
        if (node.tagName.toLowerCase() === 'svg') {
          box.appendChild(document.importNode(node, true));
        } else {
          box.textContent = '图表渲染失败';
        }
      })
      .catch(() => {
        // textContent 自动转义，不拼接 HTML
        if (alive && box) box.textContent = '图表渲染失败';
      });
    return () => {
      alive = false;
    };
  }, [code, rawId, theme]);

  return (
    <div
      ref={boxRef}
      className="my-6 min-h-[180px] rounded-2xl border border-stroke bg-surface p-4 overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
    />
  );
}
