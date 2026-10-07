<?php

namespace App\Http\Middleware;

use App\Models\SiteEntry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTranslationEnabled
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! SiteEntry::isEnabled('tool', 'translate')) {
            return response()->json(['message' => '文本翻译暂未开放。'], 404)->header('Cache-Control', 'no-store');
        }

        return $next($request);
    }
}
