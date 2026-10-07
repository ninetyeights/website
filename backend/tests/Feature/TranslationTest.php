<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Log\LogManager;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class TranslationTest extends TestCase
{
    public function test_upstream_redirects_are_rejected_without_forwarding_credentials_or_text(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        foreach (['google_web' => 502, 'google_cloud' => 422] as $provider => $status) {
            Http::swap(new Factory);
            Http::preventStrayRequests();
            Http::fake(function ($request, array $options) {
                $this->assertFalse($options['allow_redirects']);

                return Http::response('', 307, ['Location' => 'https://untrusted.invalid/collect']);
            });
            $this->postJson('/api/tools/translate', ['text' => 'private-text', 'provider' => $provider])
                ->assertStatus($status)->assertDontSee('test-key')->assertDontSee('private-text');
            Http::assertSentCount(1);
        }
    }

    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    public function test_provider_options_only_include_services_with_nonempty_keys(): void
    {
        Http::fake();
        foreach ([
            [null, null, ['google_web']],
            ['', '   ', ['google_web']],
            ['google-secret', null, ['google_web', 'google_cloud']],
            [null, 'azure-secret', ['google_web', 'azure']],
            ['google-secret', 'azure-secret', ['google_web', 'google_cloud', 'azure']],
        ] as [$googleKey, $azureKey, $expected]) {
            config([
                'services.google_translation.key' => $googleKey,
                'services.azure_translation.key' => $azureKey,
            ]);
            $response = $this->getJson('/api/tools/translate/providers')
                ->assertOk()->assertHeader('Cache-Control', 'no-store, private')
                ->assertExactJson(['providers' => $expected]);
            $this->assertStringNotContainsString('google-secret', $response->getContent());
            $this->assertStringNotContainsString('azure-secret', $response->getContent());
        }
        Http::assertNothingSent();
    }

    public function test_web_translation_joins_all_segments(): void
    {
        Http::fake(['translate.googleapis.com/*' => Http::response([[["你好。\n", 'Hello.'], ['世界。', 'World.']], null, 'en'])]);
        $this->postJson('/api/tools/translate', ['text' => "Hello.\nWorld.", 'provider' => 'google_web'])
            ->assertOk()->assertHeader('Server-Timing')->assertJsonPath('translatedText', "你好。\n世界。")
            ->assertJsonPath('detectedSourceLanguage', 'en')->assertJsonPath('provider', 'google_web');
        Http::assertSent(fn ($request) => $request['sl'] === 'auto' && $request['tl'] === 'zh-CN');
    }

    public function test_official_service_uses_credentials_and_plain_text_without_source_language(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['translation.googleapis.com/*' => Http::response(['data' => ['translations' => [['translatedText' => '<测试> & 示例', 'detectedSourceLanguage' => 'en']]]])]);
        $this->postJson('/api/tools/translate', ['text' => '<test> & example', 'provider' => 'google_cloud'])
            ->assertOk()->assertJsonPath('translatedText', '<测试> & 示例')->assertJsonPath('targetLanguage', 'zh-CN');
        Http::assertSent(fn ($request) => $request->hasHeader('X-Goog-Api-Key', 'test-key') && $request['format'] === 'text' && ! isset($request['source']));
    }

    public function test_missing_credentials_does_not_call_any_service(): void
    {
        config(['services.google_translation.key' => null]);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'google_cloud'])->assertStatus(503)
            ->assertJsonPath('error.code', 'translation_not_configured')->assertJsonPath('error.retryable', false);
        Http::assertNothingSent();
    }

    public function test_cloud_preserves_source_line_breaks_and_blank_lines(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['translation.googleapis.com/*' => Http::response(['data' => ['translations' => [
            ['translatedText' => "第一行\n\n", 'detectedSourceLanguage' => 'en'],
            ['translatedText' => "\r\n第二行\r\n", 'detectedSourceLanguage' => 'en'],
            ['translatedText' => '第三行', 'detectedSourceLanguage' => 'en'],
        ]]])]);
        $this->postJson('/api/tools/translate', [
            'text' => "First\r\n\r\n  Second\n \nThird", 'provider' => 'google_cloud',
        ])->assertOk()->assertJsonPath('translatedText', "第一行\r\n\r\n  第二行\n \n第三行");
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request['q'] === ['First', '  Second', 'Third']);
    }

    public function test_cloud_batches_many_lines_without_losing_order(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['translation.googleapis.com/*' => function ($request) {
            $this->assertLessThanOrEqual(128, count($request['q']));

            return Http::response(['data' => ['translations' => array_map(
                fn ($line) => ['translatedText' => $line."\n\n"], $request['q'],
            )]]);
        }]);
        $text = implode("\n", range(1, 128));
        $this->postJson('/api/tools/translate', ['text' => $text, 'provider' => 'google_cloud'])
            ->assertOk()->assertJsonPath('translatedText', $text);
        Http::assertSentCount(1);
    }

    public function test_cloud_rejects_multiple_upstream_batches_before_sending(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        $this->postJson('/api/tools/translate', [
            'text' => implode("\n", range(1, 129)), 'provider' => 'google_cloud',
        ])->assertStatus(422);
        Http::assertNothingSent();
    }

    public function test_cloud_preserves_outer_blank_lines_and_unicode_indentation(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['translation.googleapis.com/*' => Http::response(['data' => ['translations' => [
            ['translatedText' => "\n  第一行 \n"], ['translatedText' => '第二行'],
        ]]])]);
        $this->postJson('/api/tools/translate', [
            'text' => "\r\n\t  First  \r\n\u{3000}\r\u{3000}Second\t\n\n", 'provider' => 'google_cloud',
        ])->assertOk()->assertJsonPath('translatedText', "\r\n\t  第一行  \r\n\u{3000}\r\u{3000}第二行\t\n\n");
        Http::assertSent(fn ($request) => $request['q'] === ["\t  First  ", "\u{3000}Second\t"]);
    }

    public function test_cloud_timeout_does_not_start_another_upstream_request(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['*' => Http::failedConnection()]);
        $this->postJson('/api/tools/translate', ['text' => "First\nSecond", 'provider' => 'google_cloud'])
            ->assertStatus(504);
    }

    public function test_cloud_rejects_incomplete_batch_results(): void
    {
        config(['services.google_translation.key' => 'test-key']);
        Http::fake(['translation.googleapis.com/*' => Http::response(['data' => ['translations' => [
            ['translatedText' => '第一行'],
        ]]])]);
        $this->postJson('/api/tools/translate', ['text' => "First\nSecond", 'provider' => 'google_cloud'])
            ->assertStatus(502)->assertJsonPath('error.code', 'translation_invalid_response');
    }

    public function test_invalid_input_is_rejected_before_calling_upstream(): void
    {
        foreach ([['text' => ' ', 'provider' => 'google_web'], ['text' => ['hello'], 'provider' => 'google_web'], ['text' => 'hello', 'provider' => 'other']] as $input) {
            $this->postJson('/api/tools/translate', $input)->assertUnprocessable();
        }
        Http::assertNothingSent();
    }

    public function test_blocked_and_malformed_responses_are_safe_without_fallback(): void
    {
        config(['services.google_translation.key' => 'secret-key']);
        foreach ([Http::response('private upstream details', 429), Http::response('<html>blocked</html>'), Http::response([[[null]], null, 'en'])] as $response) {
            Http::fake(['*' => $response]);
            $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'google_web'])
                ->assertStatus(502)->assertDontSee('private upstream details')->assertDontSee('secret-key');
            Http::assertNotSent(fn ($request) => str_contains($request->url(), 'translation.googleapis.com'));
        }
    }

    public function test_timeout_has_safe_error(): void
    {
        Http::fake(['*' => Http::failedConnection()]);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'google_web'])->assertStatus(504);
    }

    public function test_cloud_errors_have_stable_categories_and_redacted_logs(): void
    {
        config(['services.google_translation.key' => 'secret-key']);
        $cases = [
            [429, 'rateLimitExceeded', 'translation_rate_limited', true, 429, 'retry_later'],
            [403, 'userRateLimitExceeded', 'translation_rate_limited', true, 429, 'retry_later'],
            [403, 'dailyLimitExceeded', 'translation_quota_exhausted', false, 503, 'contact_admin'],
            [400, 'API_KEY_INVALID', 'translation_configuration_error', false, 503, 'contact_admin'],
            [401, '', 'translation_configuration_error', false, 503, 'contact_admin'],
            [403, 'SERVICE_DISABLED', 'translation_configuration_error', false, 503, 'contact_admin'],
            [500, '', 'translation_unavailable', true, 502, 'retry_later'],
            [504, '', 'translation_timeout', true, 504, 'retry_later'],
            [400, '', 'translation_invalid_request', false, 422, 'edit_input'],
        ];
        foreach ($cases as [$upstream, $reason, $code, $retryable, $status, $action]) {
            Http::swap(new Factory);
            Http::preventStrayRequests();
            Log::swap(\Mockery::spy(LogManager::class));
            Http::fake(['*' => Http::response(['error' => [
                'message' => 'private-body secret-key', 'details' => [['reason' => $reason]],
            ]], $upstream)]);
            $response = $this->postJson('/api/tools/translate', ['text' => 'private-body', 'provider' => 'google_cloud'])
                ->assertStatus($status)->assertJsonPath('error.code', $code)
                ->assertJsonPath('error.retryable', $retryable)->assertJsonPath('error.action', $action)
                ->assertDontSee('private-body')->assertDontSee('secret-key');
            Log::shouldHaveReceived('log')->withArgs(function ($level, $message, $context) use ($upstream, $code, $response) {
                $this->assertSame(['request_id', 'provider', 'status', 'upstream_status', 'upstream_ms', 'duration_ms', 'error_code'], array_keys($context));
                $this->assertSame($response->json('requestId'), $context['request_id']);
                $this->assertSame($upstream, $context['upstream_status']);
                $this->assertSame($code, $context['error_code']);
                $this->assertGreaterThanOrEqual(0, $context['duration_ms']);
                $this->assertStringNotContainsString('secret-key', json_encode($context));
                $this->assertStringNotContainsString('private-body', json_encode($context));

                return $level === 'warning' && $message === 'translation.request';
            })->once();
        }
    }
}
