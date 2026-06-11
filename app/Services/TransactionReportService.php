<?php

namespace App\Services;

use App\Models\ElectricityTransaction;
use GuzzleHttp\Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

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
        $tz = $from->timezone->getName();

        $rows = ElectricityTransaction::query()
            ->whereBetween('created_at', [$from->copy()->timezone(config('app.timezone')), $to->copy()->timezone(config('app.timezone'))])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (ElectricityTransaction $transaction) use ($tz) {
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
                    'created_at' => optional($transaction->created_at)->setTimezone($tz)->toDateTimeString(),
                ];
            });

        $airtimeRows = $this->fetchAirtimeRows($from, $to);

        return [
            'from' => $from,
            'to' => $to,
            'rows' => $rows,
            'summary' => $this->summary($rows),
            'airtime_rows' => $airtimeRows,
            'airtime_summary' => $this->airtimeSummary($airtimeRows),
        ];
    }

    private function fetchAirtimeRows(Carbon $from, Carbon $to): Collection
    {
        $url = env('AIRTIME_API_URL');

        if (!$url) {
            return collect();
        }

        try {
            $client = new Client(['timeout' => 15, 'http_errors' => false]);
            $response = $client->get($url, [
                'query' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'per_page' => 1000],
            ]);

            $payload = json_decode($response->getBody()->getContents(), true);

            return collect($payload['data'] ?? [])->filter(function ($row) use ($from, $to) {
                if (empty($row['created_at'])) {
                    return false;
                }
                return Carbon::parse($row['created_at'])->between($from, $to);
            })->values();
        } catch (\Throwable $e) {
            Log::warning('Failed to fetch airtime transactions for report', ['message' => $e->getMessage()]);
            return collect();
        }
    }

    private function airtimeSummary(Collection $rows): array
    {
        $successRows = $rows->filter(fn($r) => strtoupper((string) $r['status']) === 'SUCCESS');
        $failedRows  = $rows->filter(fn($r) => strtoupper((string) $r['status']) === 'FAILED');
        $total       = $rows->count();

        return [
            'total_count'   => $total,
            'success_count' => $successRows->count(),
            'failed_count'  => $failedRows->count(),
            'total_amount'  => (float) $successRows->sum('amount'),
            'success_rate'  => $total ? (int) round(($successRows->count() / $total) * 100) : 0,
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
