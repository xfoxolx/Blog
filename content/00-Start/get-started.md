---
title: 从这里开始
date: 2025-12-01
description: 这篇笔记讲清楚：在这个博客里怎么写文章、怎么组织文件夹、怎么写完即发布。
tags: [指南]
---

## 写文章只需要一个文件

在 `content/` 下新建一个 `.md` 文件，写完保存，页面自动热更新，不需要重启。构建时所有文章会被一次性读入，部署后就是纯静态页面。

## 文件夹规则

`content/` 只认一层结构：

```text
content/
  00-Start/          → 显示为 Start
    get-started.md
  01-C-Language/     → 显示为 C-Language
    C-Basic.md
  my-note.md         → 直接放根目录的，归入"未分类"
```

注意三点：

- 更深的嵌套（比如 `a/b/c.md`）会被**忽略**，不会出现在网站上。
- 文件夹显示名会自动去掉开头的数字前缀，`01-C-Language` 显示为 `C-Language`，但链接里保留原样。
- 根目录直放的 `.md` 文件统一归入"未分类"分组。

## 排序规则

- 文件夹按数字前缀从小到大排，没有前缀的按字母排在后面，"未分类"永远最后。
- 同一个文件夹里的文章按 `date` 从旧到新排（旧的在上，适合写教程），`date` 相同则按文件名排。

## Frontmatter 字段

每篇文章开头用 `---` 包起来的部分是元信息：

```yaml
---
title: 从这里开始
date: 2025-12-01
description: 列表页展示的一句话简介。
cover: https://picsum.photos/seed/start/1200/600
tags: [指南]
---
```

其中 `cover` 可以不写，不写就用渐变占位图。其余四个建议都写。

## 链接与导航

文件名就是 slug，链接格式固定为：

```text
/posts/文件夹小写/文件名小写
```

比如本文的链接是 `/posts/00-start/get-started`。每篇文章底部的"上一篇 / 下一篇"只在**同一个文件夹内**循环，最后一篇的下一篇会回到本文件夹的第一篇；文件夹里只有一篇文章时不显示导航。

## 发布

```bash
npm run dev      # 本地写，改完即时刷新
npm run build    # 类型检查 + 构建
npm run deploy   # 构建并推送到 GitHub Pages
```

如果是项目页（`username.github.io/仓库名`），构建前设置 `PAGES_BASE=/仓库名/`，否则资源路径会对不上。
