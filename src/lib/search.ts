import { FOLDERS, POSTS, UNCATEGORIZED, type Post } from './posts';

// 本地全文搜索：标题 > tag > 简介 > 正文加权，中英都走子串匹配
// ponytail: O(n) 全量扫描，文章数上千才需倒排索引
export function searchPosts(query: string, limit = 8): Post[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const out: { p: Post; s: number }[] = [];
  for (const p of POSTS) {
    const title = p.title.toLowerCase();
    const tags = p.tags.join(' ');
    const desc = p.description.toLowerCase();
    const body = p.body.toLowerCase();
    let s = 0;
    let ok = true;
    for (const term of terms) {
      let ts = 0;
      if (title.includes(term)) ts += 3;
      if (tags.includes(term)) ts += 2;
      if (desc.includes(term)) ts += 1.5;
      if (body.includes(term)) ts += 1;
      if (!ts) {
        ok = false;
        break;
      }
      s += ts;
    }
    if (ok) out.push({ p, s });
  }
  return out
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.p);
}

export function folderLabel(p: Post, uncategorized: string): string {
  if (p.folder === UNCATEGORIZED) return uncategorized;
  return FOLDERS.find((f) => f.key === p.folder)?.display ?? p.folder;
}
