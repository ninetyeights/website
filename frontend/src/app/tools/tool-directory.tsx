'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Hourglass, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toolCategories, publishedTools, type Tool } from '@/lib/tools';

export function ToolDirectory({ slugs }: { slugs: string[] }) {
  const tools = useMemo(() => slugs.flatMap(slug => {
    const tool = publishedTools.find(tool => tool.slug === slug);
    return tool ? [tool] : [];
  }), [slugs]);
  const filters = ['全部', ...toolCategories.filter(category => tools.some(tool => tool.category === category))];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => {
    const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return tools.filter(
      (tool) =>
        (category === '全部' || tool.category === category) &&
        keywords.every(keyword =>
          `${tool.name} ${tool.summary} ${tool.meta} ${tool.slug} ${tool.keywords ?? ''}`
            .toLowerCase()
            .includes(keyword)),
    );
  }, [query, category, tools]);
  const ready = matches.filter(({ href }) => href).length;
  return (
    <section id="all" className="scroll-mt-24 space-y-6">
      <div data-entrance>
        <p className="text-xs text-muted-foreground">ALL TOOLS / 全部工具</p>
        <h2 className="section-title mt-1">按用途查找</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4" data-entrance>
        <div className="relative min-w-0 basis-60 flex-1">
          <label htmlFor="tool-search" className="sr-only">搜索工具</label>
          <Search
            className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
            size={18}
            aria-hidden="true"
          />
          <input
            id="tool-search"
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索工具名称或用途…"
            className="field pl-10 pr-12 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && <Button size="icon-sm" variant="ghost" className="absolute right-0 top-1/2 -translate-y-1/2" aria-label="清除搜索" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={16} aria-hidden="true" /></Button>}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="工具分类">
          {filters.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={item === category ? 'secondary' : 'ghost'}
              aria-pressed={item === category}
              onClick={() => setCategory(item)}
            >
              {item}
              <span className="text-xs text-muted-foreground">
                {item === '全部'
                  ? tools.length
                  : tools.filter((tool) => tool.category === item).length}
              </span>
            </Button>
          ))}
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {matches.length
          ? `共 ${matches.length} 个工具 · ${ready} 个已上线`
          : '没有符合条件的工具'}
      </p>
      {matches.length ? (
        <div className="space-y-8">
          {ready > 0 && <ul aria-label="已上线工具" data-entrance-group className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.filter(tool => tool.href).map(tool => <ToolCard key={tool.slug} tool={tool} />)}
          </ul>}
          {matches.length > ready && <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-medium text-muted-foreground">规划中 · 暂未开放</h3>
            <ul aria-label="规划中工具" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.filter(tool => !tool.href).map(tool => <ToolCard key={tool.slug} tool={tool} />)}
            </ul>
          </div>}
        </div>
      ) : (
        <div className="surface border-dashed bg-card/60 px-6 py-16 text-center shadow-none">
          <p className="text-lg font-medium">没有找到匹配的工具</p>
          <p className="mt-2 text-sm text-muted-foreground">
            换一个关键词，或者回到「全部」看看。
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setQuery('');
              setCategory('全部');
            }}
          >
            清除筛选
          </Button>
        </div>
      )}
    </section>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const card = (
    <Card
      className={`flex h-full flex-col transition-colors ${
        tool.href
          ? 'group-hover/tool:border-primary/40'
          : 'border-dashed bg-card/60 shadow-none'
      }`}
    >
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`flex size-12 items-center justify-center rounded-xl ${
              tool.href
                ? 'bg-secondary text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon size={22} aria-hidden="true" />
          </span>
          <Badge variant="outline">{tool.category}</Badge>
        </div>
        <CardTitle>{tool.name}</CardTitle>
        <CardDescription>{tool.summary}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
          <span>{tool.meta}</span>
          {tool.href ? (
            <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
              打开 <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Hourglass size={14} aria-hidden="true" />
              规划中
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
  return (
    <li data-entrance>
      {tool.href ? (
        <Link href={tool.href} className="group/tool block h-full rounded-xl">
          {card}
        </Link>
      ) : (
        card
      )}
    </li>
  );
}
