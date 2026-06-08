<?php

namespace App\Http\Controllers;

use App\Models\ElectricityTransaction;
use App\Models\ElectricityTransactionLog;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
        $transactions = $this->filtered($request)->latest()->paginate($perPage);

        return response()->json([
            'results' => 'SUCCESS',
            'data' => collect($transactions->items())->map(function ($transaction) {
                return $this->portalFields($transaction);
            })->values(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'summary' => $this->summary($request),
        ]);
    }

    private function filtered(Request $request, $fromOverride = null, $toOverride = null)
    {
        $query = ElectricityTransaction::query();

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->filled('transaction_id')) {
            $query->where('transaction_id', $request->transaction_id);
        }

        if ($request->filled('meter_number')) {
            $query->where('meter_number', $request->meter_number);
        }

        if ($request->filled('account_number')) {
            $query->where('account_number', $request->account_number);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($inner) use ($term) {
                $inner->where('transaction_id', 'like', $term)
                    ->orWhere('meter_number', 'like', $term)
                    ->orWhere('account_number', 'like', $term)
                    ->orWhere('customer_name', 'like', $term);
            });
        }

        $from = $fromOverride ?? ($request->filled('from') ? $request->from : null);
        $to = $toOverride ?? ($request->filled('to') ? $request->to : null);

        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }

    private function aggregate($base)
    {
        $totalCount = (clone $base)->count();
        $successCount = (clone $base)->whereIn('status', ['SUCCESS', 'SUCCESSFUL'])->count();
        $failedCount = (clone $base)->where('status', 'FAILED')->count();
        $totalAmount = (float) (clone $base)->whereIn('status', ['SUCCESS', 'SUCCESSFUL'])->sum('amount');
        $failedAmount = (float) (clone $base)->where('status', 'FAILED')->sum('amount');

        return [
            'total_count' => $totalCount,
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'pending_count' => max($totalCount - $successCount - $failedCount, 0),
            'total_amount' => $totalAmount,
            'failed_amount' => $failedAmount,
            'average_amount' => $successCount ? $totalAmount / $successCount : 0,
            'receipt_count' => (clone $base)->whereNotNull('receipt_no')->where('receipt_no', '!=', '')->count(),
            'unique_meters' => (clone $base)->whereNotNull('meter_number')->distinct('meter_number')->count('meter_number'),
            'success_rate' => $totalCount ? (int) round(($successCount / $totalCount) * 100) : 0,
        ];
    }

    private function summary(Request $request)
    {
        $summary = $this->aggregate($this->filtered($request));

        $summary['daily_totals'] = $this->filtered($request)
            ->whereIn('status', ['SUCCESS', 'SUCCESSFUL'])
            ->selectRaw('DATE(created_at) as date, SUM(amount) as amount')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($row) {
                return ['date' => (string) $row->date, 'amount' => (float) $row->amount];
            })
            ->slice(-7)
            ->values();

        $summary['top_meters'] = $this->filtered($request)
            ->whereIn('status', ['SUCCESS', 'SUCCESSFUL'])
            ->whereNotNull('meter_number')
            ->where('meter_number', '!=', '')
            ->selectRaw('meter_number, COUNT(*) as count, SUM(amount) as amount')
            ->groupBy('meter_number')
            ->orderByDesc('amount')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'meter_number' => (string) $row->meter_number,
                    'count' => (int) $row->count,
                    'amount' => (float) $row->amount,
                ];
            })
            ->values();

        $summary['trends'] = $this->trends($request, $summary);
        $summary['insights'] = $this->insights($request);

        return $summary;
    }

    private function insights(Request $request)
    {
        $base = $this->filtered($request);

        $endpoints = (clone $base)
            ->whereNotNull('endpoint')
            ->where('endpoint', '!=', '')
            ->selectRaw('endpoint, COUNT(*) as count')
            ->groupBy('endpoint')
            ->orderByDesc('count')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return ['endpoint' => (string) $row->endpoint, 'count' => (int) $row->count];
            })
            ->values();

        $hourly = (clone $base)
            ->selectRaw("CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $hourlyMap = [];
        foreach ($hourly as $row) {
            $hourlyMap[(int) $row->hour] = (int) $row->count;
        }
        $hourlyTotals = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourlyTotals[] = ['hour' => $hour, 'count' => $hourlyMap[$hour] ?? 0];
        }

        $peakHour = null;
        $peakCount = 0;
        foreach ($hourlyTotals as $row) {
            if ($row['count'] > $peakCount) {
                $peakCount = $row['count'];
                $peakHour = $row['hour'];
            }
        }

        $unitsTotal = (float) (clone $base)
            ->whereIn('status', ['SUCCESS', 'SUCCESSFUL'])
            ->sum(DB::raw('CAST(units AS REAL)'));

        $uniqueIps = (clone $base)
            ->whereNotNull('request_ip')
            ->distinct('request_ip')
            ->count('request_ip');

        return array_merge([
            'endpoints' => $endpoints,
            'hourly' => $hourlyTotals,
            'peak_hour' => $peakHour,
            'units_total' => $unitsTotal,
            'unique_ips' => $uniqueIps,
            'unique_customers' => (clone $base)->whereNotNull('customer_name')->where('customer_name', '!=', '')->distinct('customer_name')->count('customer_name'),
        ], $this->logMetrics($request));
    }

    private function logMetrics(Request $request)
    {
        $query = ElectricityTransactionLog::query();

        if ($request->filled('meter_number')) {
            $query->where('meter_number', $request->meter_number);
        }

        if ($request->filled('transaction_id')) {
            $query->where('transaction_id', $request->transaction_id);
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $providerCodes = (clone $query)
            ->whereNotNull('provider_status_code')
            ->selectRaw('provider_status_code as code, COUNT(*) as count')
            ->groupBy('code')
            ->orderByDesc('count')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return ['code' => (int) $row->code, 'count' => (int) $row->count];
            })
            ->values();

        return [
            'avg_duration_ms' => (int) round((float) (clone $query)->avg('duration_ms')),
            'max_duration_ms' => (int) (clone $query)->max('duration_ms'),
            'provider_codes' => $providerCodes,
            'log_count' => (clone $query)->count(),
        ];
    }

    public function export(Request $request)
    {
        $rows = $this->filtered($request)->latest()->limit(50000)->get();

        Audit::record('report.exported', 'Exported transactions to CSV', [
            'count' => $rows->count(),
            'filters' => $request->only(['status', 'meter_number', 'account_number', 'search', 'from', 'to']),
        ], ['category' => 'report']);

        $headers = [
            'transaction_id', 'created_at', 'status', 'amount', 'units', 'meter_number',
            'account_number', 'customer_name', 'receipt_no', 'endpoint', 'request_ip', 'message',
        ];

        $filename = 'transactions-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($rows, $headers) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->transaction_id,
                    optional($row->created_at)->toDateTimeString(),
                    $row->status,
                    $row->amount,
                    $row->units,
                    $row->meter_number,
                    $row->account_number,
                    $row->customer_name,
                    $row->receipt_no,
                    $row->endpoint,
                    $row->request_ip,
                    $row->message,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function trends(Request $request, array $current)
    {
        if (!$request->filled('from') || !$request->filled('to')) {
            return null;
        }

        try {
            $from = \Illuminate\Support\Carbon::parse($request->from)->startOfDay();
            $to = \Illuminate\Support\Carbon::parse($request->to)->startOfDay();
        } catch (\Throwable $error) {
            return null;
        }

        $lengthDays = $from->diffInDays($to) + 1;
        $prevTo = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($lengthDays - 1);

        $previous = $this->aggregate(
            $this->filtered($request, $prevFrom->toDateString(), $prevTo->toDateString())
        );

        return [
            'total_amount' => $this->pctChange($current['total_amount'], $previous['total_amount']),
            'total_count' => $this->pctChange($current['total_count'], $previous['total_count']),
            'failed_count' => $this->pctChange($current['failed_count'], $previous['failed_count']),
            'success_rate' => $current['success_rate'] - $previous['success_rate'],
        ];
    }

    private function pctChange($current, $previous)
    {
        if (!$previous) {
            return null;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    public function show($transactionId)
    {
        $transaction = ElectricityTransaction::where('transaction_id', $transactionId)
            ->latest()
            ->first();

        if (!$transaction) {
            return response()->json([
                'results' => 'FAILED',
                'message' => 'Transaction log not found.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'results' => 'SUCCESS',
            'data' => $this->portalFields($transaction),
        ]);
    }

    private function portalFields(ElectricityTransaction $transaction)
    {
        return [
            'transaction_id' => $transaction->transaction_id,
            'amount' => $transaction->amount,
            'meter_number' => $transaction->meter_number,
            'account_number' => $transaction->account_number,
            'status' => $transaction->status,
            'message' => $transaction->message,
            'customer_name' => $transaction->customer_name,
            'receipt_no' => $transaction->receipt_no,
            'units' => $transaction->units,
            'endpoint' => $transaction->endpoint,
            'request_ip' => $transaction->request_ip,
            'created_at' => optional($transaction->created_at)->toDateTimeString(),
        ];
    }
}
