<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# The Quiet Mind

**一个安静、现代、开箱即用的个人博客模板**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

写 Markdown 即发布 · 中英双语 · 暗色 / 浅色 · 命令终端 · 专注阅读 · 本地划线笔记

</div>

---

## ✨ 特性

| 方向 | 内容 |
| ---- | ---- |
| 📝 写作 | Markdown 即文章，frontmatter 元信息，文件夹即分类，脚注 / 表格 / 任务列表 / 提示块全支持 |
| 💻 代码 | Fira Code 连字，代码高亮，一键复制 / 折叠，Mermaid 图表跟随主题 |
| 🔍 发现 | `⌘K` 全文搜索、`Ctrl+\`` 命令终端（`ls` / `cd` / `vim` / `search`，Tab 补全） |
| 📖 阅读 | 专注模式（字号 / 行宽 / 衬线可调）、目录高亮、已读进度、本地划线笔记（导出 / 导入） |
| 🌍 国际化 | 中英一键切换，文案全在 `src/i18n/*.json` |
| 🎨 视觉 | 液态玻璃导航、Hero 光标拖尾、HLS 视频背景、GitHub 热力图、年份进度彩蛋 |
| 🚀 部署 | 纯静态，push 到 `main` 即由 GitHub Actions 自动发布到 GitHub Pages |

## 🚀 快速开始

> 需要 Node >= 20。

```bash
npm install
npm run dev      # 本地预览 http://localhost:5173
npm run build    # 类型检查 + 构建
```

> 推送到 `main` 即自动构建并发布到 GitHub Pages；项目页子路径（`PAGES_BASE`）已在 workflow 里自动推导，无需手动处理。

## 🧩 改成你的博客（4 步）

1. **改配置**（必改）：`src/data.ts` 里 `site` 对象——名字、签名、邮箱、GitHub、头像、社交链接、Hero 标题/视频，留空即关闭对应模块。
2. **换头像**：替换 `public/avatar.jpg`（文件名在配置里可改）。
3. **改文案**：`src/i18n/zh.json` / `en.json`。
4. **写文章**：往 `content/` 里丢 `.md` 文件。

## 📁 内容规则

```text
content/
  00-Start/          → 显示为 Start（数字前缀自动去掉，排序用）
    get-started.md
  01-C-Language/     → 显示为 C-Language
    C-Basic.md
  my-note.md         → 根目录直放，归入“未分类”
```

- 只认一层：`content/*.md` + `content/*/*.md`，更深忽略。
- 文件名 = slug，链接形如 `/posts/00-start/get-started`。
- 文件夹内按 `date` 从旧到新（适合写教程），全站按 `date` 倒序。
- 每篇开头 frontmatter：

```yaml
---
title: 从这里开始
date: 2025-12-01
description: 列表页的一句话简介
cover: https://.../cover.jpg  # 可选，不写用渐变占位
tags: [指南]
---
```

## 🗂 项目结构

```
src/
  components/   # Hero / About / Search / Terminal / ArticleNotes / CodeBlock …
  pages/        # Index / Archive / Categories / Featured / Post / Notes
  lib/          # posts / search / terminal / notes / focus / progress / theme
  i18n/         # zh.json / en.json
  data.ts       # ← 站点唯一配置文件
content/        # ← 你的文章
public/         # avatar.jpg / favicon.png
```

## ⌨️ 命令终端速查

`Ctrl+\`` 唤出，`Esc` 退出：`help` · `ls` · `cd` · `pwd` · `open|vim` · `cat` · `search` · `tag` · `random` · `theme` · `lang` · `clear` · `exit`（还有 `sudo`/`rm` 彩蛋，自己试）。

## 🛠 技术栈

React 19 · TypeScript · Vite · Tailwind CSS · react-markdown（GFM）· Framer Motion / GSAP · Mermaid · HLS.js · OGL

---

<div align="center">

> 少即是多，静水流深。

</div>
