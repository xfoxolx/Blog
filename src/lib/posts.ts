import { load as yamlLoad } from 'js-yaml';

// gray-matter 用了 Node 的 Buffer，浏览器直接炸；frontmatter 结构固定，
// 用 js-yaml（浏览器安全）+ 手写 --- 分隔代替，不给浏览器打 polyfill。
function splitmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, content: raw };
  return { data: (yamlLoad(m[1]) as Record<string, unknown>) ?? {}, content: m[2] };
}

export interface Post {
  slug: string;
  folder: string; // URL key：小写原名；根目录文件为 'uncategorized'
  title: string;
  date: string;
  description: string;
  cover?: string;
  tags: string[];
  minutes: number;
  body: string;
}

export const UNCATEGORIZED = 'uncategorized';

// 只支持一层：content/*.md + content/*/*.md，更深的文件会被忽略
const files = import.meta.glob(['../../content/*.md', '../../content/*/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function minutesOf(body: string) {
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = body.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((cjk + words) / 400));
}

function parsePath(path: string) {
  const segs = path.split('/');
  const rest = segs.slice(segs.indexOf('content') + 1);
  const file = rest.pop()!;
  return { rawDir: rest.length > 0 ? rest[0] : '', slug: file.replace(/\.md$/, '') };
}

// 显示名：去数字前缀，01-C-Language -> C-Language
export function displayOf(rawDir: string): string {
  return rawDir.replace(/^\d+[-_]/, '');
}

function toPost(path: string, raw: string): Post {
  const { rawDir, slug } = parsePath(path);
  const { data, content } = splitmatter(raw);
  const tags = Array.isArray(data.tags) ? data.tags.map((t: unknown) => String(t).toLowerCase()) : [];
  return {
    slug,
    folder: rawDir ? rawDir.toLowerCase() : UNCATEGORIZED,
    title: String(data.title ?? slug),
    date: String(data.date ?? ''),
    description: String(data.description ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    tags,
    minutes: minutesOf(content),
    body: content.trim(),
  };
}

export interface Folder {
  key: string;
  rawDir: string;
  display: string; // 去前缀后的显示名；未分类由调用方用 t('arch.uncategorized')
  posts: Post[]; // date 正序（旧在前），同 date 按文件名
}

// 有数字前缀的按数字正序排前面，无前缀的按字母排后面，未分类排最后
function folderRank(rawDir: string): [number, string] {
  if (!rawDir) return [2, ''];
  const m = rawDir.match(/^(\d+)[-_]/);
  if (m) return [0, m[1].padStart(8, '0')];
  return [1, rawDir.toLowerCase()];
}

export const FOLDERS: Folder[] = (() => {
  const groups = new Map<string, { rawDir: string; posts: Post[] }>();
  for (const [p, raw] of Object.entries(files)) {
    const { rawDir } = parsePath(p);
    const key = rawDir ? rawDir.toLowerCase() : UNCATEGORIZED;
    if (!groups.has(key)) groups.set(key, { rawDir, posts: [] });
    groups.get(key)!.posts.push(toPost(p, raw));
  }
  const folders: Folder[] = [...groups.entries()].map(([key, g]) => ({
    key,
    rawDir: g.rawDir,
    display: g.rawDir ? displayOf(g.rawDir) : '',
    posts: g.posts.sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.slug < b.slug ? -1 : 1
    ),
  }));
  folders.sort((a, b) => {
    const [ra, oa] = folderRank(a.rawDir);
    const [rb, ob] = folderRank(b.rawDir);
    if (ra !== rb) return ra - rb;
    return oa < ob ? -1 : oa > ob ? 1 : 0;
  });
  return folders;
})();

// “全部”视图保持博客惯例：date 倒序
export const POSTS: Post[] = FOLDERS.flatMap((f) => f.posts).sort((a, b) =>
  a.date < b.date ? 1 : -1
);

export const postPath = (p: { folder: string; slug: string }) =>
  `/posts/${p.folder}/${p.slug}`;

// 全站实际存在的 tag：出现次数倒序，同次数按字母序；空 tag 自动消失
// ponytail: O(n) 全量扫描，文章数上千才需缓存
export const TAGS: { tag: string; count: number }[] = (() => {
  const m = new Map<string, number>();
  for (const p of POSTS) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || (a.tag < b.tag ? -1 : 1));
})();

export const getPost = (folder: string | undefined, slug: string | undefined) =>
  FOLDERS.find((f) => f.key === folder)?.posts.find((p) => p.slug === slug);

// 文件夹内循环：最后一篇的下一篇回到第一篇；单篇文件夹 prev/next 为自身
export function siblings(
  folder: string,
  slug: string
): { prev?: Post; next?: Post } {
  const posts = FOLDERS.find((f) => f.key === folder)?.posts ?? [];
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0 || posts.length === 0) return {};
  if (posts.length === 1) return { prev: posts[0], next: posts[0] };
  return {
    prev: posts[(i - 1 + posts.length) % posts.length],
    next: posts[(i + 1) % posts.length],
  };
}
