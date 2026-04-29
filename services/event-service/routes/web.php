<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TicketController;

Route::middleware('gateway.auth')->group(function () {

    // events
    Route::get('/', [EventController::class, 'index']);
    Route::post('/', [EventController::class, 'store']);
    Route::get('/{id}', [EventController::class, 'show']);
    Route::put('/{id}', [EventController::class, 'update']);
    Route::delete('/{id}', [EventController::class, 'destroy']);

    // tickets
    Route::get('/{eventId}/tickets', [TicketController::class, 'index']);
    Route::patch('/tickets/{id}/reduce-quota', [TicketController::class, 'reduceQuota']);
});