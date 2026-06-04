<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ElectricityTransactionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'endpoint',
        'method',
        'meter_number',
        'amount',
        'status',
        'message',
        'provider_status_code',
        'duration_ms',
        'request_ip',
        'request_payload',
        'response_payload',
        'error_payload',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'request_payload' => 'array',
        'response_payload' => 'array',
        'error_payload' => 'array',
    ];

    public function transaction()
    {
        return $this->hasOne(ElectricityTransaction::class, 'transaction_log_id');
    }
}
