<?php

namespace App\Services;

use App\Exceptions\TranslationException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class AzureTranslationService
{
    public ?int $upstreamStatus = null;

    /** @return array{translatedText: string, detectedSourceLanguage: ?string, targetLanguage: string, provider: string} */
    public function translate(string $text): array
    {
        $key = config('services.azure_translation.key');
        $endpoint = config('services.azure_translation.endpoint');
        if (! is_string($key) || trim($key) === '') {
            throw new TranslationException('Azure Translator 尚未配置，请切换服务或联系管理员。', 'translation_not_configured', false, 503, 'contact_admin');
        }
        if (! is_string($endpoint) || ! filter_var($endpoint, FILTER_VALIDATE_URL) || parse_url($endpoint, PHP_URL_SCHEME) !== 'https' || parse_url($endpoint, PHP_URL_QUERY) !== null || parse_url($endpoint, PHP_URL_FRAGMENT) !== null) {
            throw new TranslationException('Azure Translator 服务地址配置不可用，请联系管理员。', 'translation_configuration_error', false, 503, 'contact_admin');
        }

        $parts = preg_split('/(\r\n|\r|\n)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        $lines = [];
        foreach ($parts as $index => $part) {
            if ($index % 2 === 0 && ! preg_match('/^\s*$/u', $part)) {
                $lines[$index] = $part;
            }
        }
        if (count($lines) > 128) {
            throw new TranslationException('单次请求最多支持 128 行正文，请分段提交。', 'translation_invalid_request', false, 422, 'edit_input');
        }

        $headers = ['Ocp-Apim-Subscription-Key' => $key];
        $region = config('services.azure_translation.region');
        if (is_string($region) && trim($region) !== '') {
            $headers['Ocp-Apim-Subscription-Region'] = $region;
        }
        $response = Http::acceptJson()->withoutRedirecting()->connectTimeout(10)->timeout(25)
            ->withHeaders($headers)
            ->post(rtrim($endpoint, '/').'/translate?api-version=3.0&to=zh-Hans&textType=plain',
                array_map(fn (string $line): array => ['Text' => $line], array_values($lines)));
        $this->upstreamStatus = $response->status();
        if (! $response->successful()) {
            throw $this->failure($response);
        }
        $translations = $response->json();
        if (! is_array($translations) || ! array_is_list($translations) || count($translations) !== count($lines)) {
            throw new TranslationException('翻译服务返回格式异常，请稍后重试。', 'translation_invalid_response', true);
        }
        $languages = [];
        foreach (array_keys($lines) as $position => $index) {
            $translated = data_get($translations[$position], 'translations.0.text');
            $target = data_get($translations[$position], 'translations.0.to');
            if (! is_string($translated) || trim($translated) === '' || $target !== 'zh-Hans') {
                throw new TranslationException('翻译服务没有返回有效译文，请稍后重试。', 'translation_invalid_response', true);
            }
            preg_match('/^(\h*).*?(\h*)$/us', $parts[$index], $spacing);
            $content = preg_replace('/[\r\n]+/', ' ', $translated);
            $content = preg_replace('/^\h+|\h+$/u', '', $content);
            $parts[$index] = $spacing[1].$content.$spacing[2];
            $language = data_get($translations[$position], 'detectedLanguage.language');
            if (is_string($language)) {
                $languages[$language] = true;
            }
        }

        return [
            'translatedText' => implode('', $parts),
            'detectedSourceLanguage' => count($languages) > 1 ? '多种语言' : array_key_first($languages),
            'targetLanguage' => 'zh-CN',
            'provider' => 'azure',
        ];
    }

    private function failure(Response $response): TranslationException
    {
        if ($response->status() === 429) {
            return new TranslationException('Azure Translator 请求过于频繁，请稍后重试。', 'translation_rate_limited', true, 429);
        }
        if (in_array($response->status(), [401, 403])) {
            return new TranslationException('Azure Translator 凭据、权限或额度不可用，请切换服务或联系管理员。', 'translation_configuration_error', false, 503, 'contact_admin');
        }
        if (in_array($response->status(), [408, 504])) {
            return new TranslationException('Azure Translator 请求超时或暂未就绪，请稍后重试。', 'translation_timeout', true, 504);
        }
        if ($response->serverError()) {
            return new TranslationException('Azure Translator 暂时出现故障，请稍后重试。', 'translation_unavailable', true);
        }

        return new TranslationException('Azure Translator 无法处理本次请求，请检查文本或联系管理员。', 'translation_invalid_request', false, 422, 'edit_input');
    }
}
