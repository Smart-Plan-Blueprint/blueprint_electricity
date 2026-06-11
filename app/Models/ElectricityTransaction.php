<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ElectricityTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_log_id',
        'transaction_id',
        'amount',
        'meter_number',
        'account_number',
        'status',
        'message',
        'customer_name',
        'receipt_no',
        'units',
        'endpoint',
        'request_ip',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function log()
    {
        return $this->belongsTo(ElectricityTransactionLog::class, 'transaction_log_id');
    }
}
