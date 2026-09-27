import { useSyncExternalStore } from 'react';

// 已读进度：localStorage 持久化，内存版本号驱动重渲染，无后端
// key 形如 `01-c-language/c-basic`，与路由一一对应
const KEY = 'blog-read-v1';

let version = 0;
const listeners = new Set<() => void>();

function read(): Record<string, 1> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

const k = (folder: string, slug: string) => `${folder}/${slug}`;

export function isRead(folder: string, slug: string): boolean {
  return read()[k(folder, slug)] === 1;
}

export function readCount(posts: { folder: string; slug: string }[]): number {
  const s = read();
  let n = 0;
  for (const p of posts) if (s[k(p.folder, p.slug)]) n++;
  return n;
}

export function markRead(folder: string, slug: string): void {
  const s = read();
  const key = k(folder, slug);
  if (s[key]) return;
  s[key] = 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 隐私模式写失败就当没读过，不炸
  }
  version++;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// 订阅后 markRead 会触发重渲染；读不到 storage 的环境也安全
export function useProgress(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}
