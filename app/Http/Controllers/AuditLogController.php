<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->latest();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        if ($request->filled('actor')) {
            $query->where('actor', 'like', '%' . $request->actor . '%');
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $perPage = min(max((int) $request->query('per_page', 50), 1), 200);
        $logs = $query->paginate($perPage);

        return response()->json([
            'results' => 'SUCCESS',
            'data' => collect($logs->items())->map(function ($log) {
                return [
                    'id' => $log->id,
                    'actor' => $log->actor,
                    'action' => $log->action,
                    'category' => $log->category,
                    'description' => $log->description,
                    'subject_type' => $log->subject_type,
                    'subject_id' => $log->subject_id,
                    'request_ip' => $log->request_ip,
                    'properties' => $log->properties,
                    'created_at' => optional($log->created_at)->toDateTimeString(),
                ];
            })->values(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'categories' => AuditLog::query()->select('category')->distinct()->pluck('category'),
        ]);
    }
}
