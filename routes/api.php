<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ElectricityController;
use App\Http\Controllers\ElectricityBkController;
use App\Http\Controllers\ElectricityProxyController;
use App\Http\Controllers\TransactionLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ReportSettingController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/



Route::post('/trialcreditvendApiKey',[ElectricityProxyController::class, 'purchaseElectricity']);
Route::post('/verifiyCustomer',[ElectricityController::class ,'verifycustomer']);

Route::middleware('auth:api')->post('/buyelectricity',[ElectricityController::class, 'buyelectricity']);
//Route::middleware('auth:api')->post('/buyelectricitytest',[ElectricityBkController::class, 'buyelectricityTest']);
//Route::post('/buyelectricityprod',[ElectricityBkController::class, 'buyelectricityTest']);
Route::middleware('auth:api')->post('/buyelectricityprod',[ElectricityBkController::class, 'buyelectricityTest']);
Route::post('/mvumba',[ElectricityController::class, 'buyelectricity']);

// Purchase power endpoint for prepaidpower.smartplanblueprint.net
Route::post('/purchase-power', [ElectricityController::class, 'buyelectricityprod'])->middleware('auth:api');
Route::get('/transaction-logs', [\App\Http\Controllers\TransactionLogController::class, 'index']);
Route::get('/transaction-logs/{transactionId}', [\App\Http\Controllers\TransactionLogController::class, 'show']);
// Route::post('/givemore','ElectricityController@verifycustomer1');
