<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_checks_database_connection(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')->andReturn([(object) ['value' => 1]]);

        $this->getJson('/api/health')->assertOk()->assertExactJson([
            'status' => 'ok',
            'database' => 'connected',
        ]);
    }

    public function test_database_failure_returns_service_unavailable_without_details(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')->andThrow(new RuntimeException('private connection details'));

        $this->getJson('/api/health')->assertStatus(503)->assertExactJson([
            'status' => 'error',
            'database' => 'unavailable',
        ]);
    }
}
