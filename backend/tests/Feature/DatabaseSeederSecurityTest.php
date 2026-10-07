<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_production_seeding_does_not_create_a_known_password_account(): void
    {
        $this->app->instance('env', 'production');
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();

        $this->assertSame(0, User::count());
    }

    public function test_local_seeding_keeps_the_example_account(): void
    {
        $this->app->instance('env', 'local');
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'is_admin' => false]);
    }
}
