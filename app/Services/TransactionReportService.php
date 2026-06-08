<?php

namespace App\Services;

use App\Models\ElectricityTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TransactionReportService
{
    public function daily(Carbon $date, $timezone = 'Africa/Gaborone')
    {
        $from = $date->copy()->timezone($timezone)->startOfDay();
        $to = $date->copy()->timezone($timezone)->endOfDay();

        return $this->forRange($from, $to);
    }

    public function forRange(Carbon $from, Carbon $to)
    {
        $rows = ElectricityTransaction::query()
            ->whereBetween('created_at', [$from->copy()->timezone(config('app.timezone')), $to->copy()->timezone(config('app.timezone'))])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (ElectricityTransaction $transaction) {
                return [
                    'transaction_id' => $transaction->transaction_id,
                    'amount' => (float) $transaction->amount,
                    'meter_number' => $transaction->meter_number,
                    'merchant_name' => 'Smart Plan Blueprint',
                    'status' => $transaction->status,
                    'message' => $transaction->message,
                    'customer_name' => $transaction->customer_name,
                    'receipt_no' => $transaction->receipt_no,
                    'units' => $transaction->units,
                    'endpoint' => $transaction->endpoint,
                    'request_ip' => $transaction->request_ip,
                    'created_at' => optional($transaction->created_at)->toDateTimeString(),
                ];
            });

        return [
            'from' => $from,
            'to' => $to,
            'rows' => $rows,
            'summary' => $this->summary($rows),
        ];
    }

    private function summary(Collection $rows)
    {
        $successRows = $rows->filter(function ($row) {
            return in_array(strtoupper((string) $row['status']), ['SUCCESS', 'SUCCESSFUL'], true);
        });
        $failedRows = $rows->filter(function ($row) {
            return strtoupper((string) $row['status']) === 'FAILED';
        });

        $totalCount = $rows->count();
        $successCount = $successRows->count();
        $failedCount = $failedRows->count();
        $totalAmount = (float) $successRows->sum('amount');

        return [
            'total_count' => $totalCount,
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'pending_count' => max($totalCount - $successCount - $failedCount, 0),
            'total_amount' => $totalAmount,
            'failed_amount' => (float) $failedRows->sum('amount'),
            'success_rate' => $totalCount ? (int) round(($successCount / $totalCount) * 100) : 0,
        ];
    }
}
