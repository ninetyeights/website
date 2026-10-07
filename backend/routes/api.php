<?php

use App\Http\Controllers\CspReportController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\SiteCatalogController;
use App\Http\Controllers\TranslationController;
use App\Http\Middleware\EnsureTranslationEnabled;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');
Route::post('/security/csp-report', CspReportController::class)->middleware('throttle:30,1')->name('security.csp-report');
Route::get('/site-catalog', SiteCatalogController::class)->name('site-catalog');
Route::post('/tools/translate', TranslationController::class)->middleware(EnsureTranslationEnabled::class)->name('tools.translate');

Route::get('/tools/translate/providers', [TranslationController::class, 'providers'])->middleware(EnsureTranslationEnabled::class)->name('tools.translate.providers');
