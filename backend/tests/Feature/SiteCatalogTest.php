<?php

namespace Tests\Feature;

use App\Filament\Resources\Projects\Pages\ManageProjects;
use App\Filament\Resources\Tools\Pages\ManageTools;
use App\Models\SiteEntry;
use App\Models\User;
use Database\Seeders\SiteEntrySeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Livewire\Livewire;
use Tests\TestCase;

class SiteCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_contains_only_flags_and_order_for_existing_pages(): void
    {
        $entries = $this->getJson('/api/site-catalog')->assertOk()->assertHeader('Cache-Control', 'no-store, private')->json('entries');
        $this->assertCount(8, $entries);
        $this->assertSame(['kind', 'slug', 'enabled', 'sort_order'], array_keys($entries[0]));
        $this->assertCount(5, array_filter($entries, fn ($entry) => $entry['kind'] === 'tool'));
        $this->assertCount(3, array_filter($entries, fn ($entry) => $entry['kind'] === 'project'));
    }

    public function test_admin_toggle_invalidates_catalog_and_blocks_translation_requests(): void
    {
        Http::preventStrayRequests();
        $this->signInAdmin();
        $entry = SiteEntry::where('slug', 'translate')->firstOrFail();
        $this->assertTrue(SiteEntry::isEnabled('tool', 'translate'));
        Livewire::test(ManageTools::class)->call('updateTableColumnState', 'enabled', (string) $entry->id, false);
        $this->assertFalse($entry->fresh()->enabled);
        $this->assertFalse(SiteEntry::isEnabled('tool', 'translate'));
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'azure'])->assertNotFound()->assertJson(['message' => '文本翻译暂未开放。']);
        $this->getJson('/api/tools/translate/providers')->assertNotFound();
        Livewire::test(ManageTools::class)->call('updateTableColumnState', 'enabled', (string) $entry->id, true);
        $this->assertTrue(SiteEntry::isEnabled('tool', 'translate'));
        $this->getJson('/api/tools/translate/providers')->assertOk();
        Http::assertNothingSent();
    }

    public function test_admin_lists_are_partitioned_and_cannot_modify_the_other_kind(): void
    {
        $this->signInAdmin();
        $tool = SiteEntry::where('slug', 'password')->firstOrFail();
        $project = SiteEntry::where('slug', 'lyricdrop')->firstOrFail();
        Livewire::test(ManageTools::class)->assertCanSeeTableRecords([$tool])->assertCanNotSeeTableRecords([$project])
            ->call('updateTableColumnState', 'enabled', (string) $project->id, false);
        $this->assertTrue($project->fresh()->enabled);
        Livewire::test(ManageProjects::class)->assertCanSeeTableRecords([$project])->assertCanNotSeeTableRecords([$tool])
            ->call('updateTableColumnState', 'enabled', (string) $project->id, false);
        $this->assertFalse($project->fresh()->enabled);
    }

    public function test_order_updates_are_validated_and_reflected_in_the_catalog(): void
    {
        $this->signInAdmin();
        $entry = SiteEntry::where('slug', 'password')->firstOrFail();
        $page = Livewire::test(ManageTools::class);
        $page->call('updateTableColumnState', 'sort_order', (string) $entry->id, 1);
        $this->assertSame(1, $entry->fresh()->sort_order);
        $this->assertSame('password', SiteEntry::catalog()[0]['slug']);
        foreach ([-1, 10000, 'bad', 1.5] as $value) {
            $page->call('updateTableColumnState', 'sort_order', (string) $entry->id, $value);
            $this->assertSame(1, $entry->fresh()->sort_order);
        }
    }

    public function test_regular_users_and_guests_cannot_manage_entries(): void
    {
        $this->get('/admin/tools')->assertRedirect('/admin/login');
        $user = User::factory()->create();
        $this->actingAs($user)->get('/admin/tools')->assertForbidden();
        $this->get('/admin/projects')->assertForbidden();
        $entry = SiteEntry::firstOrFail();
        $this->assertFalse(Gate::forUser($user)->allows('update', $entry));
    }

    public function test_reseeding_preserves_disabled_entries_and_custom_order(): void
    {
        $entry = SiteEntry::where('slug', 'lyricdrop')->firstOrFail();
        $entry->update(['enabled' => false, 'sort_order' => 2]);
        $this->seed(SiteEntrySeeder::class);
        $this->assertFalse($entry->fresh()->enabled);
        $this->assertSame(2, $entry->fresh()->sort_order);
        $this->assertSame(8, SiteEntry::count());
    }

    public function test_admin_table_escapes_stored_html_in_entry_names(): void
    {
        $this->signInAdmin();
        $payload = '<img id="xss-injected" src="x" onerror="window.__xssProbe=1"><script>window.__xssProbe=1</script>';
        $entry = SiteEntry::where('slug', 'password')->firstOrFail();
        // Only seed the isolated test database; name is intentionally not mass assignable.
        $entry->forceFill(['name' => $payload])->save();

        $html = Livewire::test(ManageTools::class)->call('loadTable')->assertCanSeeTableRecords([$entry])->html();
        $this->assertStringContainsString(e($payload), $html);
        $this->assertStringNotContainsString($payload, $html);
    }

    private function signInAdmin(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $user->saveAppAuthenticationSecret('TESTSECRETKEY234');
        $this->actingAs($user);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        Filament::bootCurrentPanel();

    }
}
