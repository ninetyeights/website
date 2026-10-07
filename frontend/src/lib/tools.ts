import { Braces, GitCompareArrows, KeyRound, Languages, Link2, QrCode, Timer, Type } from 'lucide-react';

export type ToolCategory = '文本' | '开发' | '生成' | '安全';
export type ToolIcon = typeof Languages;
export type Tool = {
  slug: string;
  name: string;
  summary: string;
  meta: string;
  category: ToolCategory;
  icon: ToolIcon;
  keywords?: string;
  // Planned entries stay in the internal list; public pages use publishedTools only.
  href: string | null;
};

export const toolCategories: ToolCategory[] = ['文本', '开发', '生成', '安全'];

export const tools: Tool[] = [
  {
    slug: 'link-extract',
    keywords: 'URL 超链接 Excel TSV CSV',
    name: '链接提取',
    summary: '从文本、网页、HTML 和 Markdown 提取链接，支持表格模式与筛选导出。',
    meta: '文本处理 · 本地提取',
    category: '文本',
    icon: Link2,
    href: '/tools/link-extract',
  },
  {
    slug: 'translate',
    keywords: 'translation 英文 外文 中文',
    name: '文本翻译',
    summary: '自动识别原文语言，翻译为简体中文；长文自动分段。',
    meta: '文本处理 · 无需登录',
    category: '文本',
    icon: Languages,
    href: '/tools/translate',
  },
  {
    slug: 'text-compare',
    keywords: 'diff 文本 比较 差异',
    name: '文字对比',
    summary: '比较两段文字，定位新增、删除与修改，支持忽略格式差异。',
    meta: '文本处理 · 本地比较',
    category: '文本',
    icon: GitCompareArrows,
    href: '/tools/text-compare',
  },
  {
    slug: 'word-count',
    name: '字数统计',
    summary: '统计字符、词数与段落，动笔前先看清篇幅。',
    meta: '文本处理',
    category: '文本',
    icon: Type,
    href: null,
  },
  {
    slug: 'json-format',
    name: 'JSON 格式化',
    summary: '让复杂的数据结构变得清晰易读，顺带校验格式。',
    meta: '开发 · 数据',
    category: '开发',
    icon: Braces,
    href: null,
  },
  {
    slug: 'timestamp',
    keywords: 'epoch 时区 毫秒 秒 批量 日期',
    name: '时间戳转换',
    summary: '在 Unix 时间戳与可读时间之间来回切换。',
    meta: '开发 · 时间',
    category: '开发',
    icon: Timer,
    href: '/tools/timestamp',
  },
  {
    slug: 'qrcode',
    name: '二维码生成',
    summary: '把网址或一段文字变成可以直接扫描的二维码。',
    meta: '生成 · 图片',
    category: '生成',
    icon: QrCode,
    href: null,
  },
  {
    slug: 'short-link',
    name: '短链生成',
    summary: '把冗长的链接收拢成简短好记的地址。',
    meta: '生成 · 网址',
    category: '生成',
    icon: Link2,
    href: null,
  },
  {
    slug: 'password',
    keywords: 'passphrase 口令 随机数 安全 密钥',
    name: '密码生成',
    summary: '生成随机密码、单词短语和 PIN，支持自定义规则与批量生成。',
    meta: '安全 · 隐私',
    category: '安全',
    icon: KeyRound,
    href: '/tools/password',
  },
];

export const publishedTools = tools.filter((tool): tool is Tool & { href: string } => Boolean(tool.href));
export const availableToolCount = publishedTools.length;
