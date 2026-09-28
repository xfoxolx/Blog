import assert from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';

// 1. 源码：Post 只许 lazy，不许静态 import Mermaid
const post = readFileSync('src/pages/Post.tsx', 'utf8');
assert.match(post, /lazy\(\(\) => import\('\.\.\/components\/Mermaid'\)\)/, 'Post must lazy-import Mermaid');
assert.doesNotMatch(post, /import Mermaid from/, 'Post must not statically import Mermaid');
assert.match(post, /<Suspense/, 'Post must wrap Mermaid in Suspense');

// 2. 源码：Mermaid 组件只许动态 import('mermaid')
const m = readFileSync('src/components/Mermaid.tsx', 'utf8');
assert.match(m, /await import\('mermaid'\)/, 'Mermaid must dynamic-import mermaid');
assert.doesNotMatch(m, /^import mermaid/m, 'Mermaid must not statically import mermaid');

// 3. 产物：mermaid 被拆到独立 chunk，主包无库代码（允许 language-mermaid 字符串）
const assets = readdirSync('dist/assets');
const main = assets.find((f) => /^index-.*\.js$/.test(f));
assert.ok(main, 'dist must contain index chunk');
assert.ok(assets.some((f) => /^Mermaid-.*\.js$/.test(f)), 'dist must contain split Mermaid chunk');
const bundle = readFileSync(`dist/assets/${main}`, 'utf8');
assert.ok(!bundle.includes('startOnLoad'), 'main bundle must not contain mermaid lib');
assert.ok(bundle.includes('language-mermaid'), 'main bundle must keep language-mermaid detector');

process.stdout.write('OK: mermaid lazy-split verified, main has no mermaid lib\n');
