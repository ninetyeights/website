<?php

namespace Tests\Feature;

use App\Services\TranslationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TranslationConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_long_text_has_no_character_limit_at_the_request_entry_for_every_provider(): void
    {
        $service = $this->mock(TranslationService::class);
        foreach (['google_web', 'google_cloud', 'azure'] as $provider) {
            $service->shouldReceive('translate')->once()->with(str_repeat('中', 10000), $provider)
                ->andReturn(['translatedText' => '测试']);
            $this->postJson('/api/tools/translate', ['text' => str_repeat('中', 10000), 'provider' => $provider])->assertOk();
        }
    }

    public function test_two_requests_are_allowed_but_the_third_is_rejected_without_calling_upstream(): void
    {
        $key = hash('sha256', '127.0.0.1');
        $locks = [];
        for ($index = 0; $index < 2; $index++) {
            $locks[] = Cache::lock("translation:{$key}:{$index}", 120);
            $this->assertTrue($locks[$index]->get());
        }
        $this->mock(TranslationService::class)->shouldNotReceive('translate');
        $this->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])
            ->assertStatus(429)->assertHeader('Retry-After', '3')
            ->assertJsonPath('error.code', 'translation_concurrency_limited')
            ->assertJsonPath('error.retryable', false);
        foreach ($locks as $lock) {
            $lock->release();
        }
    }

    public function test_success_releases_slot_and_other_ips_have_separate_capacity(): void
    {
        $key = hash('sha256', '192.0.2.1');
        for ($index = 0; $index < 2; $index++) {
            Cache::lock("translation:{$key}:{$index}", 120)->get();
        }
        $this->mock(TranslationService::class)->shouldReceive('translate')->once()->andReturn(['translatedText' => '测试']);
        $this->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])->assertOk();
        $lock = Cache::lock('translation:'.hash('sha256', '127.0.0.1').':0', 120);
        $this->assertTrue($lock->get());
        $lock->release();
    }

    public function test_exception_releases_slot(): void
    {
        $this->mock(TranslationService::class)->shouldReceive('translate')->once()->andThrow(new \RuntimeException('test failure'));
        $this->withoutExceptionHandling();
        try {
            $this->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure']);
            $this->fail('Expected exception');
        } catch (\RuntimeException $exception) {
            $this->assertSame('test failure', $exception->getMessage());
        }
        $lock = Cache::lock('translation:'.hash('sha256', '127.0.0.1').':0', 120);
        $this->assertTrue($lock->get());
        $lock->release();
    }

    public function test_second_request_is_allowed_and_expired_slots_can_be_reused(): void
    {
        $key = hash('sha256', '127.0.0.1');
        for ($index = 0; $index < 1; $index++) {
            Cache::lock("translation:{$key}:{$index}", 120)->get();
        }
        $this->mock(TranslationService::class)->shouldReceive('translate')->twice()->andReturn(['translatedText' => '测试']);
        $this->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])->assertOk();
        Cache::lock("translation:{$key}:1", 120)->get();
        $this->travel(121)->seconds();
        $this->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])->assertOk();
    }

    public function test_trusted_proxy_uses_client_ip_and_direct_requests_cannot_spoof_it(): void
    {
        $key = hash('sha256', '192.0.2.1');
        for ($index = 0; $index < 2; $index++) {
            Cache::lock("translation:{$key}:{$index}", 120)->get();
        }
        config(['trusted-proxies.addresses' => ['172.20.0.2']]);
        $this->withServerVariables(['REMOTE_ADDR' => '172.20.0.2'])
            ->withHeader('X-Forwarded-For', '192.0.2.1')
            ->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])->assertStatus(429);
        $this->mock(TranslationService::class)->shouldReceive('translate')->once()->andReturn(['translatedText' => '测试']);
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1'])
            ->postJson('/api/tools/translate', ['text' => 'test', 'provider' => 'azure'])->assertOk();
    }
}
