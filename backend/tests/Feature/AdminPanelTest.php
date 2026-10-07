<?php

namespace Tests\Feature;

use App\Filament\Widgets\AdminWelcome;
use App\Models\User;
use Filament\Auth\Pages\Login;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Livewire\Livewire;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_chinese_login_page(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/login')->assertOk()->assertSee('玖捌')->assertSee('登录');
        $this->get('/admin/register')->assertNotFound();
    }

    public function test_normal_users_cannot_access_the_panel(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
    }

    public function test_administrators_must_set_up_multi_factor_authentication(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $this->actingAs($user)->get('/admin')->assertRedirect();
        $this->assertTrue(Filament::getPanel('admin')->isMultiFactorAuthenticationRequired());
    }

    public function test_valid_administrators_can_see_the_dashboard(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $user->saveAppAuthenticationSecret('TESTSECRETKEY234');
        $this->actingAs($user)->get('/admin')->assertOk()->assertSee('仪表板');
        Livewire::test(AdminWelcome::class)->assertSee('网站管理');
    }

    public function test_login_rejects_a_non_admin_account(): void
    {
        User::factory()->create(['email' => 'member@example.com', 'password' => 'Password123456']);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        Livewire::test(Login::class)->fillForm(['email' => 'member@example.com', 'password' => 'Password123456'])
            ->call('authenticate')->assertHasFormErrors(['email']);
        $this->assertGuest();
    }

    public function test_admin_creation_hashes_password(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('管理员名称', '站点管理员')
            ->expectsQuestion('登录邮箱', 'admin@example.com')
            ->expectsQuestion('密码（至少 12 位，包含大小写字母和数字）', 'Password123456')
            ->expectsQuestion('再次输入密码', 'Password123456')
            ->assertSuccessful();
        $user = User::where('email', 'admin@example.com')->firstOrFail();
        $this->assertTrue($user->is_admin);
        $this->assertTrue(Hash::check('Password123456', $user->password));
    }

    public function test_mfa_secrets_are_encrypted_and_hidden(): void
    {
        $user = User::factory()->create();
        $user->saveAppAuthenticationSecret('TESTSECRETKEY234');
        $user->saveAppAuthenticationRecoveryCodes(['recovery-test']);
        $this->assertNotSame('TESTSECRETKEY234', $user->getRawOriginal('app_authentication_secret'));
        $this->assertArrayNotHasKey('app_authentication_secret', $user->toArray());
        $this->assertArrayNotHasKey('app_authentication_recovery_codes', $user->toArray());
        $this->assertSame(['recovery-test'], $user->fresh()->getAppAuthenticationRecoveryCodes());

    }
}
