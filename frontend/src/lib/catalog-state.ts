export type CatalogKind = 'tool' | 'project';
export type CatalogEntry = { kind: CatalogKind; slug: string; enabled: boolean; sort_order: number };

export function parseCatalog(value: unknown): CatalogEntry[] {
  if (!value || typeof value !== 'object' || !('entries' in value) || !Array.isArray(value.entries)) {
    throw new Error('Invalid site catalog');
  }
  const keys = new Set<string>();
  return value.entries.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('kind' in entry) || !('slug' in entry) || !('enabled' in entry) || !('sort_order' in entry)
      || !['tool', 'project'].includes(String(entry.kind)) || typeof entry.slug !== 'string'
      || typeof entry.enabled !== 'boolean' || !Number.isInteger(entry.sort_order) || Number(entry.sort_order) < 0) {
      throw new Error('Invalid site catalog entry');
    }
    const key = `${entry.kind}:${entry.slug}`;
    if (keys.has(key)) throw new Error('Duplicate site catalog entry');
    keys.add(key);
    return entry as CatalogEntry;
  });
}

export function selectEnabled<T extends { slug: string }>(items: T[], entries: CatalogEntry[], kind: CatalogKind): T[] {
  const known = new Map(items.map(item => [item.slug, item]));
  return entries.filter(entry => entry.kind === kind && entry.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap(entry => {
      const item = known.get(entry.slug);
      return item ? [item] : [];
    });
}

export function isEntryEnabled(entries: CatalogEntry[], kind: CatalogKind, slug: string): boolean {
  return entries.some(entry => entry.kind === kind && entry.slug === slug && entry.enabled);
}
