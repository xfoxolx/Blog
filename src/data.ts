// 站点配置：fork 本模板后只改这里 + src/i18n/*.json 里的文案 + content/ 里的文章。
// 留空即关闭：heroVideo 为空则首页无视频背景；heatmapColor 为空则隐藏 GitHub 热力图卡。
const githubUser = 'xfoxolx';
const email = 'xfoxolx@gmail.com';

export const site = {
  name: 'xfoxolx',
  role: 'Embedded · C++ · Rust',
  email,
  githubUser,
  monogram: 'BL',
  heroTitle: 'The Quiet Mind',
  // 首屏 JS 生效前的标题闪一下 index.html 里的，这个是正式标题
  pageTitle: 'The Quiet Mind — A blog about design and slow living',
  avatar: 'avatar.jpg', // public/ 下的文件名
  heroVideo:
    'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8',
  heatmapColor: '3fb950',
  stack: ['TypeScript', 'JavaScript', 'C++', 'Rust', 'Python', 'HTML', 'CSS', 'Git', 'Embedded'],
  socials: [
    { label: 'GitHub', href: `https://github.com/${githubUser}` },
    { label: 'Email', href: `mailto:${email}` },
  ],
};

export type Site = typeof site;
