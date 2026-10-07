<?php

namespace App\Services;

use App\Exceptions\TranslationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class TranslationService
{
    public float $upstreamMs = 0;

    public ?int $upstreamStatus = null;

    private function cloudFailure(Response $response): TranslationException
    {
        $reasons = array_merge(
            (array) data_get($response->json(), 'error.errors.*.reason', []),
            (array) data_get($response->json(), 'error.details.*.reason', []),
        );
        if (array_intersect($reasons, ['dailyLimitExceeded', 'DAILY_LIMIT_EXCEEDED', 'BILLING_DISABLED', 'billingNotActive'])) {
            return new TranslationException('Google Cloud 额度或计费不可用，请切换服务或联系管理员。', 'translation_quota_exhausted', false, 503, 'contact_admin');
        }
        if ($response->status() === 429 || array_intersect($reasons, ['rateLimitExceeded', 'userRateLimitExceeded', 'RATE_LIMIT_EXCEEDED'])) {
            return new TranslationException('Google Cloud 请求过于频繁，请稍后重试。', 'translation_rate_limited', true, 429);
        }
        if (in_array($response->status(), [401, 403]) || array_intersect($reasons, ['API_KEY_INVALID', 'API_KEY_SERVICE_BLOCKED', 'SERVICE_DISABLED', 'ACCESS_TOKEN_EXPIRED', 'keyInvalid'])) {
            return new TranslationException('Google Cloud 凭据、权限或服务配置不可用，请切换服务或联系管理员。', 'translation_configuration_error', false, 503, 'contact_admin');
        }
        if (in_array($response->status(), [408, 504])) {
            return new TranslationException('Google Cloud 请求超时，请稍后重试。', 'translation_timeout', true, 504);
        }
        if ($response->serverError()) {
            return new TranslationException('Google Cloud 暂时出现故障，请稍后重试。', 'translation_unavailable', true);
        }

        return new TranslationException('Google Cloud 无法处理本次请求，请检查文本或联系管理员。', 'translation_invalid_request', false, 422, 'edit_input');
    }

    /** @return array{translatedText: string, detectedSourceLanguage: ?string, targetLanguage: string, provider: string} */
    public function translate(string $text, string $provider): array
    {
        $key = config('services.google_translation.key');
        if ($provider === 'google_cloud' && ! $key) {
            // Credential and quota problems are operator concerns; the 503 identifies
            // them in logs while the visitor only learns the service is unavailable.
            throw new TranslationException('Google Cloud 尚未配置，请切换服务或联系管理员。', 'translation_not_configured', false, 503, 'contact_admin');
        }

        $started = hrtime(true);
        try {
            if ($provider === 'azure') {
                $azure = app(AzureTranslationService::class);
                try {
                    return $azure->translate($text);
                } finally {
                    $this->upstreamStatus = $azure->upstreamStatus;
                }
            }
            if ($provider === 'google_cloud') {
                return $this->translateCloudLines($text, $key);
            }
            $client = Http::acceptJson()->withoutRedirecting()->connectTimeout(10)->timeout(25);
            $response = $client->get('https://translate.googleapis.com/translate_a/single', [
                'client' => 'gtx', 'sl' => 'auto', 'tl' => 'zh-CN', 'dt' => 't', 'q' => $text,
            ]);
        } catch (ConnectionException) {
            throw new TranslationException('翻译服务连接失败或超时，请稍后重试。', 'translation_timeout', true, 504);
        } finally {
            $this->upstreamMs = (hrtime(true) - $started) / 1e6;
        }

        $this->upstreamStatus = $response->status();
        if (! $response->successful()) {
            throw new TranslationException('翻译服务暂时不可用，请稍后重试或切换服务。', 'translation_unavailable', true);
        }

        $data = $response->json();
        $segments = is_array($data) ? ($data[0] ?? null) : null;
        if (! is_array($segments) || $segments === []) {
            throw new TranslationException('翻译服务返回了无法识别的内容，请稍后重试。', 'translation_invalid_response', true);
        }
        $parts = [];
        foreach ($segments as $segment) {
            if (! is_array($segment) || ! isset($segment[0]) || ! is_string($segment[0])) {
                throw new TranslationException('翻译服务返回格式异常，请稍后重试。', 'translation_invalid_response', true);
            }
            $parts[] = $segment[0];
        }
        $translation = implode('', $parts);
        $language = $data[2] ?? null;
        if (! is_string($translation) || trim($translation) === '') {
            throw new TranslationException('翻译服务没有返回有效译文，请稍后重试。', 'translation_invalid_response', true);
        }

        return [
            'translatedText' => $translation,
            'detectedSourceLanguage' => is_string($language) ? $language : null,
            'targetLanguage' => 'zh-CN',
            'provider' => $provider,
        ];
    }

    /** @return array{translatedText: string, detectedSourceLanguage: ?string, targetLanguage: string, provider: string} */
    private function translateCloudLines(string $text, string $key): array
    {
        $parts = preg_split('/(\r\n|\r|\n)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        $lines = [];
        foreach ($parts as $index => $part) {
            if ($index % 2 === 0 && ! preg_match('/^\s*$/u', $part)) {
                $lines[$index] = $part;
            }
        }

        $languages = [];
        if (count($lines) > 128) {
            throw new TranslationException('单次请求最多支持 128 行正文，请分段提交。', 'translation_invalid_request', false, 422, 'edit_input');
        }
        $batch = $lines;
        $response = Http::acceptJson()->withoutRedirecting()->connectTimeout(10)->timeout(25)
            ->withHeaders(['X-Goog-Api-Key' => $key])
            ->post('https://translation.googleapis.com/language/translate/v2', [
                'q' => array_values($batch), 'target' => 'zh-CN', 'format' => 'text',
            ]);
        $this->upstreamStatus = $response->status();
        if (! $response->successful()) {
            throw $this->cloudFailure($response);
        }
        $translations = $response->json('data.translations');
        if (! is_array($translations) || ! array_is_list($translations) || count($translations) !== count($batch)) {
            throw new TranslationException('翻译服务返回格式异常，请稍后重试。', 'translation_invalid_response', true);
        }
        foreach (array_keys($batch) as $position => $index) {
            $translated = $translations[$position]['translatedText'] ?? null;
            if (! is_string($translated) || trim($translated) === '') {
                throw new TranslationException('翻译服务没有返回有效译文，请稍后重试。', 'translation_invalid_response', true);
            }
            // Line separators belong to the source; upstream must only supply line content.
            preg_match('/^(\h*).*?(\h*)$/us', $parts[$index], $spacing);
            $content = preg_replace('/[\r\n]+/', ' ', $translated);
            $content = preg_replace('/^\h+|\h+$/u', '', $content);
            $parts[$index] = $spacing[1].$content.$spacing[2];
            $language = $translations[$position]['detectedSourceLanguage'] ?? null;
            if (is_string($language)) {
                $languages[$language] = true;
            }
        }

        return [
            'translatedText' => implode('', $parts),
            'detectedSourceLanguage' => count($languages) > 1 ? '多种语言' : array_key_first($languages),
            'targetLanguage' => 'zh-CN',
            'provider' => 'google_cloud',
        ];
    }
}
