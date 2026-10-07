<?php

namespace Database\Seeders;

use App\Models\SiteEntry;
use Illuminate\Database\Seeder;

class SiteEntrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (config('site-catalog') as $kind => $entries) {
            $order = 10;
            foreach ($entries as $slug => $name) {
                $entry = SiteEntry::firstOrNew(['kind' => $kind, 'slug' => $slug]);
                if (! $entry->exists) {
                    $entry->forceFill(['kind' => $kind, 'slug' => $slug, 'name' => $name, 'enabled' => true, 'sort_order' => $order])->save();
                }
                $order += 10;
            }
        }
    }
}
