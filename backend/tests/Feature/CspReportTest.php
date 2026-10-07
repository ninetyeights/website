<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class CspReportTest extends TestCase
{
    public function test_browser_report_is_collected_without_sensitive_fields(): void
    {
        Log::shouldReceive('notice')->once()->with('csp_report_only_violation', [
            'directive' => 'script-src-elem', 'blocked_kind' => 'inline',
        ]);
        $this->call('POST', '/api/security/csp-report', [], [], [], [
            'CONTENT_TYPE' => 'application/csp-report',
        ], json_encode(['csp-report' => [
            'effective-directive' => 'script-src-elem', 'blocked-uri' => 'inline',
            'document-uri' => 'https://example.com/admin?token=secret', 'script-sample' => 'private text',
        ]]))->assertNoContent();
    }

    public function test_resource_urls_are_replaced_with_a_fixed_category(): void
    {
        Log::shouldReceive('notice')->once()->with('csp_report_only_violation', [
            'directive' => 'script-src', 'blocked_kind' => 'resource',
        ]);
        $this->postJson('/api/security/csp-report', ['csp-report' => [
            'effective-directive' => 'script-src', 'blocked-uri' => 'https://private.example/?key=secret',
        ]])->assertNoContent();
    }

    public function test_malformed_or_unknown_reports_are_not_logged(): void
    {
        Log::shouldReceive('notice')->never();
        foreach ([[], ['csp-report' => 'invalid'], ['csp-report' => ['effective-directive' => "script-src\nforged"]]] as $body) {
            $this->postJson('/api/security/csp-report', $body)->assertNoContent();
        }
    }

    public function test_oversized_reports_are_rejected(): void
    {
        Log::shouldReceive('notice')->never();
        $this->postJson('/api/security/csp-report', ['padding' => str_repeat('x', 16385)])->assertStatus(413);
    }

    public function test_report_endpoint_is_rate_limited(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/security/csp-report', [])->assertNoContent();
        }
        $this->postJson('/api/security/csp-report', [])->assertStatus(429);
    }
}
