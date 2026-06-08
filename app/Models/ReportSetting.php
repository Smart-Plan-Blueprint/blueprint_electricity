<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportSetting extends Model
{
    protected $fillable = [
        'enabled',
        'recipients',
        'timezone',
        'send_time',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'recipients' => 'array',
    ];

    public static function current()
    {
        return static::query()->firstOrCreate([], [
            'enabled' => filter_var(env('DAILY_REPORT_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
            'recipients' => [],
            'timezone' => env('DAILY_REPORT_TIMEZONE', 'Africa/Gaborone'),
            'send_time' => env('DAILY_REPORT_SEND_TIME', '02:00'),
        ]);
    }

    public function normalizedRecipients()
    {
        return collect($this->recipients ?: [])
            ->map(function ($email) {
                return strtolower(trim((string) $email));
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
