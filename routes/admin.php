<?php

use App\Http\Controllers\Admin\DashboardAdminController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\UserAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/


Route::middleware(['auth', 'verified'])->prefix('admin')->as('admin.')->group(function () {
    Route::post('/impersonate/stop', [ImpersonationController::class, 'stop'])->name('impersonate.stop');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->as('admin.')->group(function () {

    Route::get('/dashboard', DashboardAdminController::class)->name('dashboard');

    Route::resource('users', UserAdminController::class);
    Route::post('users/{user}/restore', [UserAdminController::class, 'restore'])->name('users.restore');
    Route::post('users/{user}/ban', [UserAdminController::class, 'ban'])->name('users.ban');
    Route::post('users/{user}/unban', [UserAdminController::class, 'unban'])->name('users.unban');
    Route::post('users/{user}/assign-role', [UserAdminController::class, 'assignRole'])->name('users.assign-role');
    Route::post('users/{user}/remove-role', [UserAdminController::class, 'removeRole'])->name('users.remove-role');
    Route::post('users/bulk', [UserAdminController::class, 'bulk'])->name('users.bulk');

    Route::post('users/{user}/impersonate', [ImpersonationController::class, 'start'])->name('users.impersonate');
});
