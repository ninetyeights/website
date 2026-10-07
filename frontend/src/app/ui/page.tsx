'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MotionButton } from '@/components/ui/motion-button';
import { useState, useSyncExternalStore } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Code2,
  Globe,
  Loader2,
  Plus,
  Puzzle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const sections = [
  ['logos', 'Logo 对比'],
  ['glass', '磨砂玻璃'],
  ['foundation', '基础样式'],
  ['buttons', '按钮与状态'],
  ['cards', '资源卡片'],
  ['forms', '表单与筛选'],
];
const logoOptions = [
  { name: '青绿几何', src: '/brand/jiuba-98-geometric-v1.png' },
  { name: '灰猫', src: '/brand/jiuba-gray-cat-v1.png' },
];
const subscribeMotionPreference = (callback: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const getMotionPreference = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'normal';
const getServerMotionPreference = () => 'pending';

export default function UIPage() {
  const [fullMotion, setFullMotion] = useState(false);
  const motionPreference = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, getServerMotionPreference);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [message, setMessage] = useState('');
  return (
    <>
      <main className="page-container space-y-12 py-10 max-md:space-y-8 max-md:py-6">
        <section className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge variant="secondary">设计规范 / 草案</Badge>
            <h1 className="text-4xl leading-tight font-bold max-md:text-[28px]">
              让内容清晰，让操作自然。
            </h1>
            <p className="text-muted-foreground">
              在实际组件中查看字体、留白和层级。绿色与深墨色搭配柔和卡片，磨砂玻璃用于导航和精选区域。配色仍可调整。
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            返回基础项目 ↗
          </Link>
        </section>
        <nav
          aria-label="预览页章节"
          className="flex flex-wrap gap-2 border-b pb-4"
        >
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
        <section id="logos" className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="section-title">Logo 实际效果</h2>
            <p className="mt-2 text-sm text-muted-foreground">保留两款设计作对比，整站导航与浏览器图标统一使用灰猫。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {logoOptions.map((logo) => (
              <Card key={logo.src}>
                <CardHeader><CardTitle>{logo.name}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-center bg-white p-4">
                      <Image src={logo.src} alt={`${logo.name} Logo，浅色背景`} width={180} height={180} className="h-auto w-full max-w-44" />
                    </div>
                    <div className="flex items-center justify-center bg-slate-900 p-4">
                      <Image src={logo.src} alt={`${logo.name} Logo，深色背景`} width={180} height={180} className="h-auto w-full max-w-44" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-semibold">
                    <Image src={logo.src} alt="" width={48} height={48} />
                    <span>玖捌小站</span>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section
          id="glass"
          className="scroll-mt-24 space-y-6"
        >
          <div>
            <p className="text-xs text-muted-foreground">SURFACES / 磨砂玻璃</p>
            <h2 className="section-title mt-1">轻盈的层次，清楚的内容</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              向下滚动，顶部导航会柔和地透出经过的内容。
            </p>
          </div>
          <div className="glass-stage">
            <div className="glass-surface grid items-center gap-8 rounded-2xl p-6 md:grid-cols-[1fr_auto] md:p-10">
              <div className="max-w-xl space-y-4">
                <Badge variant="secondary">精选区域 · 材质预览</Badge>
                <h3 className="text-2xl font-semibold leading-snug md:text-[28px]">
                  把值得留下的，放在一起。
                </h3>
                <p className="text-sm text-slate-600">
                  工具、书签与灵感，都有自己的位置。半透明的表面保留背景层次，让文字保持清晰。
                </p>
                <a
                  href="#cards"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  查看卡片样例 <ArrowUpRight size={16} />
                </a>
              </div>
              <div
                className="flex items-center gap-3"
                aria-hidden="true"
              >
                {[Code2, Bookmark, Puzzle].map((Icon, i) => (
                  <span
                    key={i}
                    className="flex size-14 items-center justify-center rounded-2xl border border-white bg-white/80 text-primary shadow-sm md:size-16"
                  >
                    <Icon size={24} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          id="foundation"
          className="scroll-mt-24 space-y-6"
        >
          <div>
            <p className="text-xs text-muted-foreground">01 / FOUNDATION</p>
            <h2 className="section-title mt-1">字体与色彩</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>清晰的阅读层级</CardTitle>
                <CardDescription>
                  系统字体 · 中文与英文保持自然节奏
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground">
                    28px / 栏目标题
                  </p>
                  <p className="text-[28px] font-semibold leading-snug">
                    发现值得收藏的资源
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    20px / 区块标题
                  </p>
                  <p className="section-title">本周精选</p>
                </div>
                <div>
                  <p className="text-base">
                    把好用的工具、软件与灵感，放在容易找到的地方。
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    14px 说明文字，用于介绍用途与补充信息。
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    12px 元信息 · 最近收录
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>候选配色</CardTitle>
                <CardDescription>
                  主色只用于行动、链接与选中状态。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ['主色', '#007A55'],
                    ['主色浅底', '#E8F6F0'],
                    ['页面背景', '#F8FAFC'],
                    ['主文字', '#182B29'],
                    ['辅助文字', '#64748B'],
                    ['边框', '#E2E8F0'],
                  ].map(([name, color]) => (
                    <div key={name}>
                      <div
                        className="mb-2 h-16 rounded-lg border"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{color}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section
          id="buttons"
          className="scroll-mt-24 space-y-6"
        >
          <div>
            <p className="text-xs text-muted-foreground">02 / ACTIONS</p>
            <h2 className="section-title mt-1">统一的按钮与反馈</h2>
          </div>
          <Card>
            <CardContent className="space-y-6">
              <div className="space-y-2 rounded-lg bg-secondary p-4 text-sm">
                <p>“开始使用”为保留的 Motion 备选；普通按钮采用点击水波纹，不再整体收缩。</p>
                <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={fullMotion} onChange={event => setFullMotion(event.target.checked)} className="size-4 accent-primary"/>播放完整动效（仅此次预览）</label>
                <p className="text-xs text-muted-foreground" role="status">{motionPreference === 'pending' ? '客户端尚未连接：如果此提示一直不变，页面交互脚本未完成加载。' : `客户端已连接 · 系统：${motionPreference === 'reduced' ? '减少动态' : '允许动画'} · 当前：${fullMotion || motionPreference === 'normal' ? '完整动效' : '减少动态'} · 预览版本 M2`}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <MotionButton previewFullMotion={fullMotion} onClick={() => setMessage('Motion 主按钮已点击：柔光、光晕与弹簧回弹')}>
                  开始使用
                </MotionButton>
                <Button
                  variant="outline"
                  onClick={() => setMessage('次按钮已点击')}
                >
                  查看详情
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setMessage('浅色按钮已点击')}
                >
                  辅助操作
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSaved(!saved)}
                  aria-pressed={saved}
                >
                  {saved ? <Check /> : <Bookmark />}
                  {saved ? '已收藏' : '收藏'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    setMessage('这里只预览危险按钮，没有删除任何内容。')
                  }
                >
                  删除示例
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t pt-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMessage('小按钮 · 桌面 32px')}
                >
                  小号 32
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMessage('默认按钮 · 桌面 40px')}
                >
                  默认 40
                </Button>
                <Button
                  size="lg"
                  onClick={() => setMessage('大按钮 · 48px')}
                >
                  大号 48
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="添加示例"
                  onClick={() => setMessage('图标按钮已点击')}
                >
                  <Plus />
                </Button>
                <Button disabled>不可用</Button>
                <Button disabled>
                  <Loader2 className="animate-spin" />
                  保存中
                </Button>
              </div>
              <p
                role="status"
                className="min-h-6 text-sm text-muted-foreground"
              >
                {message ||
                  '试试点击、Tab 聚焦与收藏状态。手机端点击区域至少 44px。'}
              </p>
            </CardContent>
          </Card>
        </section>
        <section
          id="cards"
          className="scroll-mt-24 space-y-6"
        >
          <div>
            <p className="text-xs text-muted-foreground">03 / CONTENT</p>
            <h2 className="section-title mt-1">同一套语言，不同的内容结构</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              以下为展示样例，尚未接入资源数据。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Code2,
                title: 'JSON 格式化',
                type: '在线工具',
                text: '让复杂的数据结构变得清晰易读。',
                meta: '开发 · 文本处理',
              },
              {
                icon: Globe,
                title: '设计灵感收藏',
                type: '书签导航',
                text: '收集值得反复翻看的页面与设计细节。',
                meta: '网站 · 灵感',
              },
              {
                icon: Puzzle,
                title: '浏览器效率助手',
                type: '浏览器扩展',
                text: '简化常用操作，让浏览更专注。',
                meta: 'Chrome · Edge',
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                      <item.icon size={22} />
                    </span>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="border-t pt-4 text-xs text-muted-foreground">
                    {item.meta}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section
          id="forms"
          className="scroll-mt-24 space-y-6"
        >
          <div>
            <p className="text-xs text-muted-foreground">04 / INPUTS</p>
            <h2 className="section-title mt-1">轻量的输入与筛选</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>查找资源</CardTitle>
                <CardDescription>
                  筛选样式预览，不执行全站搜索。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">搜索关键词</span>
                  <span className="relative block">
                    <Search
                      className="absolute left-3 top-3 text-muted-foreground"
                      size={18}
                    />
                    <input
                      className="field pl-10"
                      placeholder="搜索工具、软件、网站…"
                      type="search"
                    />
                  </span>
                </label>
                <div
                  className="flex flex-wrap gap-2"
                  aria-label="资源类型"
                >
                  {['全部', '在线工具', '书签', '扩展', '软件'].map((x) => (
                    <Button
                      key={x}
                      size="sm"
                      variant={x === filter ? 'secondary' : 'ghost'}
                      aria-pressed={x === filter}
                      onClick={() => setFilter(x)}
                    >
                      {x}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前选中：{filter}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>字段状态</CardTitle>
                <CardDescription>
                  标签、说明与错误各有自己的位置。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">资源名称</span>
                  <input
                    className="field"
                    placeholder="输入一个清晰的名称"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">
                    网址 · 错误状态示例
                  </span>
                  <input
                    className="field"
                    defaultValue="example"
                    aria-invalid="true"
                    aria-describedby="url-error"
                  />
                  <span
                    id="url-error"
                    className="block text-[13px] text-destructive"
                  >
                    请输入包含 https:// 的完整网址。
                  </span>
                </label>
              </CardContent>
            </Card>
          </div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-xs text-muted-foreground">
          <span>玖捌小站 · UI 规格预览</span>
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={14} />
            8px 按钮圆角 / 16px 卡片圆角 / 24px 卡片间距
          </span>
        </footer>
      </main>
    </>
  );
}
