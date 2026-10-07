<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TrustConfiguredProxies extends TrustProxies
{
    protected $headers = Request::HEADER_X_FORWARDED_FOR;

    protected function setTrustedProxyIpAddresses(Request $request): void
    {
        $addresses = [];
        foreach (config('trusted-proxies.addresses', []) as $address) {
            if (! is_string($address) || ! filter_var($address, FILTER_VALIDATE_IP)) {
                throw new InvalidArgumentException('TRUSTED_PROXY_IPS must contain exact IP addresses.');
            }
            $addresses[] = $address;
        }

        foreach (config('trusted-proxies.hosts', []) as $host) {
            if (! is_string($host) || ! preg_match('/\A[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\z/', $host)) {
                throw new InvalidArgumentException('TRUSTED_PROXY_HOSTS must contain explicit service names.');
            }
            foreach ($this->resolveHost($host) as $address) {
                if (filter_var($address, FILTER_VALIDATE_IP)) {
                    $addresses[] = $address;
                }
            }
        }

        // Never fall back to trusting the request's sender, wildcards or cloud host names.
        $request->setTrustedProxies(array_values(array_unique($addresses)), Request::HEADER_X_FORWARDED_FOR);
    }

    protected function resolveHost(string $host): array
    {
        return gethostbynamel($host) ?: [];
    }
}
