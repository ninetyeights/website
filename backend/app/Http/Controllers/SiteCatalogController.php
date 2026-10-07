<?php

namespace App\Http\Controllers;

use App\Models\SiteEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteCatalogController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(['entries' => SiteEntry::catalog()])->header('Cache-Control', 'no-store');
    }
}
