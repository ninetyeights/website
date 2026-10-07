export const contentSections = [
  { slug: 'projects', label: '项目', description: '分享正在构建的作品与实践。' },
  { slug: 'tools', label: '工具', description: '让日常工作更轻松的在线工具。' },
];

export const navigationItems = [
  { href: '/', label: '首页' },
  ...contentSections.filter(({ slug }) => ['projects', 'tools'].includes(slug)).map(({ slug, label }) => ({ href: `/${slug}`, label })),
  { href: '/feedback', label: '反馈' },
];
