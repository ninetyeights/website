<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class CspReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        if (strlen($request->getContent()) > 16384) {
            return response('', 413);
        }

        $report = $request->json('csp-report');
        $directive = is_array($report) ? ($report['effective-directive'] ?? null) : null;
        if (! is_string($directive) || ! in_array($directive, [
            'script-src', 'script-src-elem', 'script-src-attr', 'style-src',
            'style-src-elem', 'style-src-attr', 'connect-src', 'img-src',
            'font-src', 'frame-src', 'worker-src', 'object-src', 'base-uri',
            'form-action', 'frame-ancestors', 'default-src',
        ], true)) {
            return response('', 204);
        }

        // Reports are untrusted telemetry. Never log URLs, script samples or raw bodies.
        $blocked = $report['blocked-uri'] ?? null;
        $kind = in_array($blocked, ['inline', 'eval', 'wasm-eval'], true) ? $blocked : 'resource';
        Log::notice('csp_report_only_violation', [
            'directive' => $directive,
            'blocked_kind' => $kind,
        ]);

        return response('', 204);
    }
}
