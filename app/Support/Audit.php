<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class Audit
{
    public static function record($action, $description = null, array $properties = [], $options = [])
    {
        $user = Auth::guard('api')->user();

        $payload = [
            'user_id' => $user->id ?? ($options['user_id'] ?? null),
            'actor' => $user->email ?? ($options['actor'] ?? 'system'),
            'action' => $action,
            'category' => $options['category'] ?? 'general',
            'subject_type' => $options['subject_type'] ?? null,
            'subject_id' => isset($options['subject_id']) ? (string) $options['subject_id'] : null,
            'description' => $description,
            'request_ip' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 255),
            'properties' => $properties ?: null,
        ];

        try {
            return AuditLog::create($payload);
        } catch (\Throwable $error) {
            Log::warning('Audit record failed: ' . $error->getMessage(), $payload);
            return null;
        }
    }
}
