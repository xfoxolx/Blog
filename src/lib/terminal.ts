import { FOLDERS, POSTS, TAGS, type Post } from './posts';
import { searchPosts } from './search';

// 只读导航终端的纯逻辑：解析 / 补全 / 执行，不碰 DOM、不碰路由，
// UI 层（Terminal.tsx）只负责渲染 + 把 action 落到 navigate/theme/lang。
// ponytail: O(n) 全量扫描，文章数上千才需索引
export interface TermLine {
  kind: 'cmd' | 'out' | 'err';
  text: string;
}

type TermAction =
  | { type: 'open'; post: Post }
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'theme'; theme: 'dark' | 'light' }
  | { type: 'lang'; lang: 'zh' | 'en' };

export interface ExecCtx {
  cwd: string; // '' = 根目录，否则为 folder key
  results: Post[]; // 上次 search/tag 的结果，供 `open <编号>` 用
  t: (k: string) => string;
  help: string[];
}

export interface ExecResult {
  lines: TermLine[];
  cwd: string;
  results: Post[];
  action?: TermAction;
}

const COMMANDS = [
  'help', 'ls', 'cd', 'pwd', 'open', 'vim', 'cat',
  'search', 'tag', 'random', 'theme', 'lang', 'clear', 'exit',
  'sudo', 'rm',
];

export function displayPath(cwd: string): string {
  return cwd ? `/${cwd}` : '/';
}

function cleanDir(arg: string): string {
  return arg.replace(/\/+$/, '').replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
}

// 目录参数 → folder key（'' 为根）；认 key 也认显示名；不认返回 null
function resolveDir(arg: string | undefined, cwd: string): string | null {
  if (arg === undefined || arg === '' || arg === '.') return cwd;
  if (arg === '/' || arg === '..') return '';
  const key = cleanDir(arg);
  const hit = FOLDERS.find((f) => f.key === key || f.display.toLowerCase() === key);
  return hit ? hit.key : null;
}

function findPost(folder: string, slug: string): Post | undefined {
  const posts = FOLDERS.find((f) => f.key === folder.toLowerCase())?.posts;
  return posts?.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

// 文章参数 → 一篇 / 多篇（同名）/ null；先认当前目录，再全局认 slug
function resolvePost(arg: string, cwd: string): Post | Post[] | null {
  const clean = arg.trim().replace(/\.md$/i, '');
  if (!clean) return null;
  if (clean.includes('/')) {
    const i = clean.indexOf('/');
    return findPost(clean.slice(0, i), clean.slice(i + 1)) ?? null;
  }
  if (cwd) {
    const p = findPost(cwd, clean);
    if (p) return p;
  }
  const matches = POSTS.filter((p) => p.slug.toLowerCase() === clean.toLowerCase());
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return matches;
  return null;
}

const out = (text: string): TermLine => ({ kind: 'out', text });
const err = (text: string): TermLine => ({ kind: 'err', text });

export function execute(raw: string, ctx: ExecCtx): ExecResult {
  const { t } = ctx;
  let { cwd, results } = ctx;
  const lines: TermLine[] = [];
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { lines, cwd, results };
  const [cmdRaw, ...args] = parts;
  const cmd = cmdRaw.toLowerCase();
  const arg = args.join(' ');
  const noSuch = (name: string) => err(`${cmd}: ${name}: ${t('terminal.noSuch')}`);

  switch (cmd) {
    case 'help':
      return { lines: ctx.help.map((h) => out(h)), cwd, results };
    case 'pwd':
      return { lines: [out(displayPath(cwd))], cwd, results };
    case 'ls': {
      const dir = resolveDir(args[0], cwd);
      if (dir === null) return { lines: [noSuch(args[0])], cwd, results };
      if (dir === '') {
        return {
          // 列真实 key（cd 的参数），显示名只在 cd 补全时兼容，不展示
          lines: FOLDERS.map((f) => out(`${f.key}/  ${f.posts.length}`)),
          cwd,
          results,
        };
      }
      const folder = FOLDERS.find((f) => f.key === dir)!;
      return { lines: folder.posts.map((p) => out(`${p.slug}  ${p.title}`)), cwd, results };
    }
    case 'cd': {
      const dir = resolveDir(args[0], cwd);
      if (dir === null) return { lines: [noSuch(args[0] || '')], cwd, results };
      return { lines, cwd: dir, results };
    }
    case 'open':
    case 'vim': {
      if (!arg) return { lines: [err(t('terminal.openUsage'))], cwd, results };
      if (/^\d+$/.test(arg)) {
        const p = results[Number(arg) - 1];
        if (!p) return { lines: [noSuch(arg)], cwd, results };
        return { lines: [out(`→ ${p.title}`)], cwd, results, action: { type: 'open', post: p } };
      }
      const hit = resolvePost(arg, cwd);
      if (!hit) return { lines: [noSuch(arg)], cwd, results };
      if (Array.isArray(hit)) {
        return {
          lines: [out(t('terminal.ambiguous')), ...hit.map((p) => out(`  ${p.folder}/${p.slug}  ${p.title}`))],
          cwd,
          results,
        };
      }
      return { lines: [out(`→ ${hit.title}`)], cwd, results, action: { type: 'open', post: hit } };
    }
    case 'cat': {
      if (!arg) return { lines: [err(t('terminal.openUsage'))], cwd, results };
      const hit = /^\d+$/.test(arg) ? results[Number(arg) - 1] : resolvePost(arg, cwd);
      const post = Array.isArray(hit) ? hit[0] : hit;
      if (!post) return { lines: [noSuch(arg)], cwd, results };
      const preview = post.body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((l) => out(l.slice(0, 120)));
      return {
        lines: [out(`# ${post.title}`), ...(post.description ? [out(post.description)] : []), ...preview],
        cwd,
        results,
      };
    }
    case 'search': {
      if (!arg) return { lines: [err(t('terminal.searchUsage'))], cwd, results };
      const hits = searchPosts(arg, 5);
      if (!hits.length) return { lines: [out(t('search.empty'))], cwd, results };
      return {
        lines: hits.map((p, i) => out(`${i + 1}. ${p.title}  (${p.folder} · ${p.date})`)),
        cwd,
        results: hits,
      };
    }
    case 'tag': {
      if (!arg) {
        return { lines: TAGS.map((x) => out(`#${x.tag}  ${x.count}`)), cwd, results };
      }
      const hits = POSTS.filter((p) => p.tags.includes(arg.toLowerCase())).slice(0, 8);
      if (!hits.length) return { lines: [out(t('search.empty'))], cwd, results };
      return {
        lines: hits.map((p, i) => out(`${i + 1}. ${p.title}  (${p.folder} · ${p.date})`)),
        cwd,
        results: hits,
      };
    }
    case 'random': {
      if (!POSTS.length) return { lines: [out(t('search.empty'))], cwd, results };
      const p = POSTS[Math.floor(Math.random() * POSTS.length)];
      return { lines: [out(`→ ${p.title}`)], cwd, results, action: { type: 'open', post: p } };
    }
    case 'theme': {
      if (arg !== 'dark' && arg !== 'light')
        return { lines: [err(t('terminal.themeUsage'))], cwd, results };
      return { lines: [out(`theme: ${arg}`)], cwd, results, action: { type: 'theme', theme: arg } };
    }
    case 'lang': {
      if (arg !== 'zh' && arg !== 'en')
        return { lines: [err(t('terminal.langUsage'))], cwd, results };
      return { lines: [out(`lang: ${arg}`)], cwd, results, action: { type: 'lang', lang: arg } };
    }
    case 'clear':
      return { lines, cwd, results, action: { type: 'clear' } };
    case 'exit':
      return { lines, cwd, results, action: { type: 'exit' } };
    case 'sudo':
      return { lines: [out(t('terminal.sudo'))], cwd, results };
    case 'rm':
      return { lines: [out(t('terminal.rm'))], cwd, results };
    default:
      return { lines: [err(`${t('terminal.unknown')}${cmdRaw}`)], cwd, results };
  }
}

export interface Completion {
  text: string;
  list: string[];
}

function commonPrefix(xs: string[]): string {
  if (!xs.length) return '';
  let p = xs[0];
  for (const x of xs.slice(1)) {
    let i = 0;
    while (i < p.length && p[i] === x[i]) i++;
    p = p.slice(0, i);
  }
  return p;
}

// Tab 补全（默认光标在行尾）：首词补命令，其余按命令补路径/文章/标签
export function complete(input: string, cwd: string): Completion {
  const endsSpace = /\s$/.test(input);
  const tokens = input.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || (tokens.length === 1 && !endsSpace)) {
    const pre = (tokens[0] ?? '').toLowerCase();
    const hits = COMMANDS.filter((c) => c.startsWith(pre));
    if (hits.length === 1) return { text: `${hits[0]} `, list: [] };
    if (hits.length > 1) {
      const cp = commonPrefix(hits);
      return { text: cp.length > pre.length ? cp : input, list: hits };
    }
    return { text: input, list: [] };
  }
  const [cmdRaw, ...rest] = tokens;
  const cmd = cmdRaw.toLowerCase();
  const frag = endsSpace ? '' : (rest[rest.length - 1] ?? '');
  const base = input.slice(0, input.length - frag.length);
  const done = (hits: string[], suffix = ' '): Completion => {
    if (hits.length === 1)
      return { text: base + hits[0] + (hits[0].endsWith('/') ? '' : suffix), list: [] };
    if (hits.length > 1) {
      const cp = commonPrefix(hits);
      return { text: cp.length > frag.length ? base + cp : input, list: hits };
    }
    return { text: input, list: [] };
  };

  const folders = FOLDERS.map((f) => f.key);
  if (cmd === 'cd' || cmd === 'ls') {
    const key = frag.replace(/^\//, '').toLowerCase();
    return done(folders.filter((k) => k.startsWith(key)));
  }
  if (cmd === 'open' || cmd === 'vim' || cmd === 'cat') {
    if (frag.includes('/')) {
      const i = frag.indexOf('/');
      const head = frag.slice(0, i).toLowerCase();
      const tail = frag.slice(i + 1).toLowerCase();
      const folder = FOLDERS.find((f) => f.key === head);
      if (folder) {
        return done(
          folder.posts.filter((p) => p.slug.toLowerCase().startsWith(tail)).map((p) => `${folder.key}/${p.slug}`)
        );
      }
      return done(folders.filter((k) => k.startsWith(head)).map((k) => `${k}/`), '');
    }
    if (cwd) {
      const folder = FOLDERS.find((f) => f.key === cwd)!;
      return done(folder.posts.filter((p) => p.slug.toLowerCase().startsWith(frag.toLowerCase())).map((p) => p.slug));
    }
    const keys = folders.filter((k) => k.startsWith(frag.toLowerCase())).map((k) => `${k}/`);
    const slugs = [...new Set(POSTS.map((p) => p.slug))].filter((s) =>
      s.toLowerCase().startsWith(frag.toLowerCase())
    );
    return done([...keys, ...slugs]);
  }
  if (cmd === 'tag') {
    return done(TAGS.map((x) => x.tag).filter((x) => x.startsWith(frag.toLowerCase())));
  }
  if (cmd === 'theme') {
    return done(['dark', 'light'].filter((x) => x.startsWith(frag.toLowerCase())));
  }
  if (cmd === 'lang') {
    return done(['zh', 'en'].filter((x) => x.startsWith(frag.toLowerCase())));
  }
  return { text: input, list: [] };
}

// ponytail: 解析器最小自检，只在 dev 跑一次，改坏了控制台立刻冒泡
if (import.meta.env.DEV) {
  const t = (k: string) => k;
  const ctx = { cwd: '', results: [], t, help: [] };
  console.assert(resolveDir('/', 'x') === '', 'terminal: cd /');
  console.assert(resolveDir('..', 'x') === '', 'terminal: cd ..');
  console.assert(
    execute('pwd', ctx).lines.map((l) => l.text).join() === '/',
    'terminal: pwd'
  );
  console.assert(execute('nope', ctx).lines[0]?.kind === 'err', 'terminal: unknown cmd');
  console.assert(
    complete('', '').list.length === COMMANDS.length,
    'terminal: command completion'
  );
}
