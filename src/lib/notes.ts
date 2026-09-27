import { useSyncExternalStore } from 'react';

// 本地划线笔记：localStorage 持久化，内存版本号驱动重渲染，无后端
// key 形如 `01-c-language/c-basic`，与路由一一对应
export interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface Backup {
  version: 1;
  exportedAt: number;
  notes: Record<string, Note[]>;
}

const KEY = 'blog-notes-v1';
const MAX_TEXT = 1000;
const MAX_PER_ARTICLE = 500;

let version = 0;
const listeners = new Set<() => void>();

function isNote(v: unknown): v is Note {
  if (!v || typeof v !== 'object') return false;
  const n = v as Record<string, unknown>;
  return typeof n.id === 'string' && typeof n.text === 'string' && typeof n.createdAt === 'number';
}

function readAll(): Record<string, Note[]> {
  let raw: unknown = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Note[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      const list = v.filter(isNote).slice(0, MAX_PER_ARTICLE);
      if (list.length) out[k] = list;
    }
  }
  return out;
}

function writeAll(all: Record<string, Note[]>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // 隐私模式写失败就不存，不炸
  }
  version++;
  listeners.forEach((l) => l());
}

export function listNotes(articleKey: string): Note[] {
  return readAll()[articleKey] ?? [];
}

// 全局管理页用：一次拿全部分组；空分组不存，所以无须过滤
// ponytail: O(n) 全量扫描，笔记上万条才需索引
// SAFETY: 返回的是每次现拼的快照，调用方只读不写，不会污染 storage
//（写回统一走 writeAll，read-then-write 竞态在单线程 + 同步 localStorage 下不存在）
export function listAllNotes(): Record<string, Note[]> {
  return readAll();
}

const nid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// 相同文本直接返回旧条目：重复划线不堆条目
export function saveNote(articleKey: string, raw: string): Note | null {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  if (!text) return null;
  const all = readAll();
  const list = all[articleKey] ?? [];
  const dup = list.find((n) => n.text === text);
  if (dup) return dup;
  const note: Note = { id: nid(), text, createdAt: Date.now() };
  writeAll({ ...all, [articleKey]: [...list, note].slice(-MAX_PER_ARTICLE) });
  return note;
}

export function removeNote(articleKey: string, id: string): void {
  const all = readAll();
  const list = all[articleKey] ?? [];
  const next = list.filter((n) => n.id !== id);
  if (next.length === list.length) return;
  if (next.length) all[articleKey] = next;
  else delete all[articleKey];
  writeAll(all);
}

export function clearNotes(articleKey: string): void {
  const all = readAll();
  if (!all[articleKey]) return;
  delete all[articleKey];
  writeAll(all);
}

export function exportNotes(): string {
  const backup: Backup = { version: 1, exportedAt: Date.now(), notes: readAll() };
  return JSON.stringify(backup, null, 2);
}

// 返回新增条数；格式不对直接 throw，调用方落错误态
// 裸 Record<string, Note[]> 也认（手写/别处导来的照单全收）
export function importNotes(json: string): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('bad backup');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('bad backup');
  const data = (parsed as { notes?: unknown }).notes ?? parsed;
  if (!data || typeof data !== 'object') throw new Error('bad backup');
  const all = readAll();
  let added = 0;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof k !== 'string' || !Array.isArray(v)) continue;
    const list = all[k] ?? [];
    const ids = new Set(list.map((n) => n.id));
    for (const item of v) {
      if (!isNote(item) || ids.has(item.id)) continue;
      list.push({
        id: item.id.slice(0, 64),
        text: item.text.slice(0, MAX_TEXT),
        createdAt: item.createdAt || Date.now(),
      });
      ids.add(item.id);
      added++;
    }
    all[k] = list.slice(-MAX_PER_ARTICLE);
  }
  writeAll(all);
  return added;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// 订阅后 save/remove/import 会触发重渲染；读不到 storage 的环境也安全
export function useNotes(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}
