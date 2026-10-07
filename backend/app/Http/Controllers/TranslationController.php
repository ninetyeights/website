<?php

namespace App\Http\Controllers;

use App\Exceptions\TranslationException;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TranslationController extends Controller
{
    public function providers(): JsonResponse
    {
        $providers = ['google_web'];
        foreach (['google_cloud' => 'google_translation', 'azure' => 'azure_translation'] as $provider => $service) {
            if (trim((string) config("services.{$service}.key")) !== '') {
                $providers[] = $provider;
            }
        }

        return response()->json(['providers' => $providers])->header('Cache-Control', 'no-store');
    }

    public function __invoke(Request $request, TranslationService $service): JsonResponse
    {
        $data = $request->validate([
            'text' => ['bail', 'required', 'string', function (string $attribute, mixed $value, \Closure $fail): void {
                if (is_string($value) && preg_match('/^\s*$/u', $value)) {
                    $fail('请输入需要翻译的文本。');
                }
            }],
            'provider' => ['required', Rule::in(['google_web', 'google_cloud', 'azure'])],
        ], ['text.required' => '请输入需要翻译的文本。', 'text.string' => '原文必须是文本。', 'provider.required' => '请选择翻译服务。', 'provider.in' => '不支持此翻译服务。']);

        $requestId = (string) Str::uuid();
        $slot = null;
        $clientKey = hash('sha256', (string) $request->ip());
        for ($index = 0; $index < 2; $index++) {
            $candidate = Cache::lock("translation:{$clientKey}:{$index}", 120);
            if ($candidate->get()) {
                $slot = $candidate;
                break;
            }
        }
        if ($slot === null) {
            return response()->json([
                'message' => '当前网络的翻译请求较多，请等待部分请求完成后重试。',
                'error' => ['code' => 'translation_concurrency_limited', 'retryable' => false, 'action' => 'wait'],
                'requestId' => $requestId,
            ], 429)->header('Retry-After', '3')->header('Cache-Control', 'no-store');
        }
        $errorCode = null;
        try {
            $response = response()->json($service->translate($data['text'], $data['provider']));
        } catch (TranslationException $exception) {
            $errorCode = $exception->errorCode;
            $response = response()->json([
                'message' => $exception->getMessage(),
                'error' => ['code' => $errorCode, 'retryable' => $exception->retryable, 'action' => $exception->action],
                'requestId' => $requestId,
            ], $exception->getCode());
        } finally {
            $slot->release();
        }

        // Application time starts after PHP accepts the request; it excludes server queue time.
        $appMs = (microtime(true) - $request->server('REQUEST_TIME_FLOAT', microtime(true))) * 1000;
        Log::log($errorCode ? 'warning' : 'info', 'translation.request', [
            'request_id' => $requestId,
            'provider' => $data['provider'],
            'status' => $response->getStatusCode(),
            'upstream_status' => $service->upstreamStatus,
            'upstream_ms' => round($service->upstreamMs, 2),
            'duration_ms' => round($appMs, 2),
            'error_code' => $errorCode,
        ]);

        return $response->header('X-Request-Id', $requestId)->header('Cache-Control', 'no-store')->header('Server-Timing', sprintf('upstream;dur=%.2f, app;dur=%.2f', $service->upstreamMs, $appMs));
    }
}
