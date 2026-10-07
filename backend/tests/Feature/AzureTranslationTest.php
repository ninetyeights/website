<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Log\LogManager;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AzureTranslationTest extends TestCase
{
    public function test_upstream_redirects_are_rejected_without_forwarding_credentials_or_text(): void
    {
        Http::fake(function ($request, array $options) {
            $this->assertFalse($options['allow_redirects']);

            return Http::response('', 307, ['Location' => 'https://untrusted.invalid/collect']);
        });
        $this->postJson('/api/tools/translate', ['text' => 'private-text', 'provider' => 'azure'])
            ->assertStatus(422)->assertDontSee('azure-secret')->assertDontSee('private-text');
        Http::assertSentCount(1);
    }

    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config([
            'services.azure_translation.key' => 'azure-secret',
            'services.azure_translation.region' => 'eastus',
            'services.azure_translation.endpoint' => 'https://api.cognitive.microsofttranslator.com',
        ]);
    }

    public function test_azure_uses_backend_credentials_and_preserves_lines(): void
    {
        Http::fake(['api.cognitive.microsofttranslator.com/*' => Http::response([
            ['detectedLanguage' => ['language' => 'en'], 'translations' => [['text' => "\n 第一行 \n", 'to' => 'zh-Hans']]],
            ['detectedLanguage' => ['language' => 'ja'], 'translations' => [['text' => '<第二行> & 示例', 'to' => 'zh-Hans']]],
        ])]);
        $this->postJson('/api/tools/translate', ['text' => "\r\n\tFirst  \r\n \n\u{3000}Second\n", 'provider' => 'azure'])
            ->assertOk()->assertHeader('Server-Timing')->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('translatedText', "\r\n\t第一行  \r\n \n\u{3000}<第二行> & 示例\n")
            ->assertJsonPath('provider', 'azure')->assertJsonPath('targetLanguage', 'zh-CN')
            ->assertJsonPath('detectedSourceLanguage', '多种语言')->assertDontSee('azure-secret');
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->method() === 'POST'
            && $request->url() === 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=zh-Hans&textType=plain'
            && $request->hasHeader('Ocp-Apim-Subscription-Key', 'azure-secret')
            && $request->hasHeader('Ocp-Apim-Subscription-Region', 'eastus')
            && $request->data() === [['Text' => "\tFirst  "], ['Text' => "\u{3000}Second"]]);
    }

    public function test_missing_credentials_and_invalid_endpoint_do_not_call_upstream(): void
    {
        config(['services.azure_translation.key' => null]);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'azure'])
            ->assertStatus(503)->assertJsonPath('error.code', 'translation_not_configured');
        config(['services.azure_translation.key' => 'azure-secret', 'services.azure_translation.endpoint' => 'http://invalid']);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'azure'])
            ->assertStatus(503)->assertJsonPath('error.code', 'translation_configuration_error');
        Http::assertNothingSent();
    }

    public function test_global_resource_can_omit_region(): void
    {
        config(['services.azure_translation.region' => null]);
        Http::fake(['*' => Http::response([['translations' => [['text' => '你好', 'to' => 'zh-Hans']]]])]);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'azure'])
            ->assertOk()->assertJsonPath('detectedSourceLanguage', null);
        Http::assertSent(fn ($request) => ! $request->hasHeader('Ocp-Apim-Subscription-Region'));
    }

    public function test_azure_rejects_oversized_requests_before_sending(): void
    {
        $this->postJson('/api/tools/translate', ['text' => implode("\n", range(1, 129)), 'provider' => 'azure'])
            ->assertStatus(422)->assertJsonPath('error.code', 'translation_invalid_request');
        Http::assertNothingSent();
    }

    public function test_azure_errors_are_safe_and_do_not_fall_back_to_google(): void
    {
        foreach ([
            [401, 503, 'translation_configuration_error', false],
            [403, 503, 'translation_configuration_error', false],
            [429, 429, 'translation_rate_limited', true],
            [500, 502, 'translation_unavailable', true],
            [503, 502, 'translation_unavailable', true],
            [408, 504, 'translation_timeout', true],
            [504, 504, 'translation_timeout', true],
            [400, 422, 'translation_invalid_request', false],
        ] as [$upstream, $status, $code, $retryable]) {
            Http::swap(new Factory);
            Http::preventStrayRequests();
            Http::fake(['*' => Http::response(['error' => ['message' => 'private-body azure-secret']], $upstream)]);
            $this->postJson('/api/tools/translate', ['text' => 'private-body', 'provider' => 'azure'])
                ->assertStatus($status)->assertJsonPath('error.code', $code)->assertJsonPath('error.retryable', $retryable)
                ->assertDontSee('azure-secret')->assertDontSee('private-body');
            Http::assertSentCount(1);
            Http::assertNotSent(fn ($request) => str_contains($request->url(), 'google'));
        }
    }

    public function test_azure_rejects_malformed_empty_and_incomplete_responses(): void
    {
        foreach ([
            '<html>private</html>', [], ['translations' => []],
            [['translations' => [['text' => ' ', 'to' => 'zh-Hans']]]],
            [['translations' => [['text' => '你好', 'to' => 'en']]]],
            [['translations' => [['text' => '你好', 'to' => 'zh-Hans']]]],
        ] as $body) {
            Http::swap(new Factory);
            Http::preventStrayRequests();
            Http::fake(['*' => Http::response($body)]);
            $this->postJson('/api/tools/translate', ['text' => "First\nSecond", 'provider' => 'azure'])
                ->assertStatus(502)->assertJsonPath('error.code', 'translation_invalid_response');
        }
    }

    public function test_azure_accepts_batch_boundary_and_long_text(): void
    {
        Http::fake(['*' => function ($request) {
            return Http::response(array_map(fn (array $line): array => [
                'detectedLanguage' => ['language' => 'en'],
                'translations' => [['text' => $line['Text'], 'to' => 'zh-Hans']],
            ], $request->data()));
        }]);
        foreach ([implode("\n", range(1, 128)), str_repeat('x', 10000)] as $text) {
            $this->postJson('/api/tools/translate', ['text' => $text, 'provider' => 'azure'])
                ->assertOk()->assertJsonPath('translatedText', $text);
        }
        Http::assertSentCount(2);
    }

    public function test_azure_logs_only_safe_metadata(): void
    {
        Log::swap(\Mockery::spy(LogManager::class));
        Http::fake(['*' => Http::response(['error' => ['message' => 'private-body azure-secret']], 401)]);
        $response = $this->postJson('/api/tools/translate', ['text' => 'private-body', 'provider' => 'azure'])
            ->assertStatus(503);
        Log::shouldHaveReceived('log')->withArgs(function ($level, $message, $context) use ($response) {
            $this->assertSame(['request_id', 'provider', 'status', 'upstream_status', 'upstream_ms', 'duration_ms', 'error_code'], array_keys($context));
            $this->assertSame($response->json('requestId'), $context['request_id']);
            $this->assertSame('azure', $context['provider']);
            $this->assertSame(401, $context['upstream_status']);
            $this->assertStringNotContainsString('azure-secret', json_encode($context));
            $this->assertStringNotContainsString('private-body', json_encode($context));

            return $level === 'warning' && $message === 'translation.request';
        })->once();
    }

    public function test_azure_connection_failure_is_safe_without_fallback(): void
    {
        Http::fake(['*' => Http::failedConnection()]);
        $this->postJson('/api/tools/translate', ['text' => 'hello', 'provider' => 'azure'])
            ->assertStatus(504)->assertJsonPath('error.code', 'translation_timeout');
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'google'));
    }
}
