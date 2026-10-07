<?php

return [
    // Exact IP addresses only; no wildcard, REMOTE_ADDR or entire private subnets.
    'addresses' => array_values(array_filter(array_map('trim', explode(',', env('TRUSTED_PROXY_IPS', ''))))),

    // Explicit internal service names, resolved per request to avoid stale Docker IPs.
    'hosts' => array_values(array_filter(array_map('trim', explode(',', env('TRUSTED_PROXY_HOSTS', ''))))),
];
