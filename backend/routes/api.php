<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\HealthController;

// Health check
Route::get('/health', [HealthController::class, 'check']);

// PDF Upload
Route::post('/upload-pdf', [PDFController::class, 'upload']);

// Project management
Route::get('/projects', [ProjectController::class, 'index']);
Route::post('/projects', [ProjectController::class, 'store']);
Route::get('/projects/{id}', [ProjectController::class, 'show']);
Route::put('/projects/{id}', [ProjectController::class, 'update']);
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

// Model export
Route::post('/export-model', [ProjectController::class, 'exportModel']);
