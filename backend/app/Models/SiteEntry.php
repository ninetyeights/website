<?php

namespace App\Models;

use Database\Factories\SiteEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteEntry extends Model
{
    /** @use HasFactory<SiteEntryFactory> */
    use HasFactory;

    public const CATALOG_CACHE_KEY = 'site_catalog:v1';

    protected $fillable = ['enabled', 'sort_order'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean', 'sort_order' => 'integer'];
    }

    protected static function booted(): void
    {
        static::saved(fn () => self::clearCatalogCache());
        static::deleted(fn () => self::clearCatalogCache());
    }

    private static function clearCatalogCache(): void
    {
        Cache::lock(self::CATALOG_CACHE_KEY.':refresh', 10)->block(5,
            fn () => Cache::forget(self::CATALOG_CACHE_KEY));
    }

    /** @return array<int, array{kind: string, slug: string, enabled: bool, sort_order: int}> */
    public static function catalog(): array
    {
        $cached = Cache::get(self::CATALOG_CACHE_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        // Serialize cache fills with invalidation so a concurrent read cannot
        // write old flags back after an administrator has saved a change.
        return Cache::lock(self::CATALOG_CACHE_KEY.':refresh', 10)->block(5,
            fn () => Cache::remember(self::CATALOG_CACHE_KEY, 60, fn () => self::query()
                ->orderBy('sort_order')->orderBy('id')
                ->get(['kind', 'slug', 'enabled', 'sort_order'])->toArray()));
    }

    public static function isEnabled(string $kind, string $slug): bool
    {
        foreach (self::catalog() as $entry) {
            if ($entry['kind'] === $kind && $entry['slug'] === $slug) {
                return $entry['enabled'];
            }
        }

        return false;
    }
}
