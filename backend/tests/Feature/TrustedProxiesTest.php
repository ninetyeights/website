<?php

namespace Tests\Feature;

use App\Http\Middleware\TrustConfiguredProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use InvalidArgumentException;
use Mockery;
use Tests\TestCase;

class TrustedProxiesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['trusted-proxies.addresses' => [], 'trusted-proxies.hosts' => []]);
        Route::get('/_test/proxy', fn (Request $request) => response()->json([
            'ip' => $request->ip(), 'secure' => $request->isSecure(), 'host' => $request->getHost(),
        ]));
    }

    public function test_private_addresses_are_not_trusted_by_default(): void
    {
        foreach (['10.0.0.4', '172.18.0.9', '192.168.1.4'] as $peer) {
            $this->withServerVariables(['REMOTE_ADDR' => $peer, 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'])
                ->getJson('/_test/proxy')->assertOk()->assertJsonPath('ip', $peer);
        }
    }

    public function test_only_the_exact_configured_proxy_ip_is_trusted(): void
    {
        config(['trusted-proxies.addresses' => ['172.18.0.5']]);
        foreach (['172.18.0.5' => '203.0.113.7', '172.18.0.6' => '172.18.0.6'] as $peer => $expected) {
            $this->withServerVariables(['REMOTE_ADDR' => $peer, 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'])
                ->getJson('/_test/proxy')->assertJsonPath('ip', $expected);
        }
    }

    public function test_explicit_ipv6_proxy_is_supported(): void
    {
        config(['trusted-proxies.addresses' => ['fd00::5']]);
        $this->withServerVariables(['REMOTE_ADDR' => 'fd00::5', 'HTTP_X_FORWARDED_FOR' => '2001:db8::7'])
            ->getJson('/_test/proxy')->assertJsonPath('ip', '2001:db8::7');
    }

    public function test_service_names_resolve_to_specific_addresses_and_refresh(): void
    {
        config(['trusted-proxies.hosts' => ['frontend']]);
        $middleware = Mockery::mock(TrustConfiguredProxies::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $middleware->shouldReceive('resolveHost')->with('frontend')->twice()->andReturn(['172.18.0.5'], ['172.18.0.8']);
        $this->instance(TrustConfiguredProxies::class, $middleware);
        $this->withServerVariables(['REMOTE_ADDR' => '172.18.0.5', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'])
            ->getJson('/_test/proxy')->assertJsonPath('ip', '203.0.113.7');
        $this->withServerVariables(['REMOTE_ADDR' => '172.18.0.5', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'])
            ->getJson('/_test/proxy')->assertJsonPath('ip', '172.18.0.5');
    }

    public function test_dns_failure_does_not_trust_the_sender(): void
    {
        config(['trusted-proxies.hosts' => ['frontend']]);
        $middleware = Mockery::mock(TrustConfiguredProxies::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $middleware->shouldReceive('resolveHost')->with('frontend')->once()->andReturn([]);
        $this->instance(TrustConfiguredProxies::class, $middleware);
        $this->withServerVariables(['REMOTE_ADDR' => '172.18.0.5', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'])
            ->getJson('/_test/proxy')->assertJsonPath('ip', '172.18.0.5');
    }

    public function test_unconfigured_forwarded_host_and_protocol_are_ignored(): void
    {
        config(['trusted-proxies.addresses' => ['172.18.0.5']]);
        $this->withServerVariables([
            'REMOTE_ADDR' => '172.18.0.5', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
            'HTTP_X_FORWARDED_PROTO' => 'https', 'HTTP_X_FORWARDED_HOST' => 'attacker.example',
        ])->getJson('/_test/proxy')->assertJsonPath('secure', false)->assertJsonPath('host', 'localhost');
    }

    public function test_wildcard_proxy_configuration_is_rejected(): void
    {
        $this->withoutExceptionHandling();
        config(['trusted-proxies.addresses' => ['*']]);
        $this->expectException(InvalidArgumentException::class);
        $this->getJson('/_test/proxy');
    }

    public function test_subnet_proxy_configuration_is_rejected(): void
    {
        $this->withoutExceptionHandling();
        config(['trusted-proxies.addresses' => ['172.16.0.0/12']]);
        $this->expectException(InvalidArgumentException::class);
        $this->getJson('/_test/proxy');
    }
}
