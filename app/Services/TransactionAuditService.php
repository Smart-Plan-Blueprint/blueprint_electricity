<?php

namespace App\Services;

use App\Models\ElectricityTransaction;
use App\Models\ElectricityTransactionLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TransactionAuditService
{
    public function start(Request $request, array $payload, $endpoint = null)
    {
        try {
            $safePayload = $this->sanitizePayload($payload);

            return ElectricityTransactionLog::create([
                'user_id' => optional($request->user())->id,
                'transaction_id' => $this->firstValue($payload, [
                    'transID',
                    'transaction_id',
                    'transactionId',
                    'clientSaleId',
                ]),
                'endpoint' => $endpoint ?: $request->path(),
                'method' => $request->method(),
                'meter_number' => $this->firstValue($payload, ['meterNumber', 'meter_number']),
                'amount' => $this->parseAmount($this->firstValue($payload, ['amount', 'transactionAmount'])),
                'status' => 'PENDING',
                'request_ip' => $request->ip(),
                'request_payload' => $safePayload,
            ]);
        } catch (\Throwable $e) {
            Log::error('Unable to start electricity transaction log', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function finish($transactionLog, $responsePayload, $providerStatusCode = null, $durationMs = null, $errorPayload = null)
    {
        if (!$transactionLog instanceof ElectricityTransactionLog) {
            return null;
        }

        try {
            $responsePayload = $this->normalizePayload($responsePayload);
            $errorPayload = $errorPayload ? $this->normalizePayload($errorPayload) : null;
            $status = $this->extractStatus($responsePayload, $errorPayload);
            $message = $this->extractMessage($responsePayload, $errorPayload);

            $transactionLog->update([
                'status' => $status,
                'message' => $message,
                'provider_status_code' => $providerStatusCode,
                'duration_ms' => $durationMs,
                'response_payload' => $this->sanitizePayload($responsePayload),
                'error_payload' => $errorPayload ? $this->sanitizePayload($errorPayload) : null,
            ]);

            return $this->extractPortalTransaction($transactionLog, $responsePayload, $status, $message);
        } catch (\Throwable $e) {
            Log::error('Unable to finish electricity transaction log', [
                'transactionLogId' => $transactionLog->id,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function extractPortalTransaction(ElectricityTransactionLog $transactionLog, array $responsePayload, $status, $message)
    {
        $requestPayload = $transactionLog->request_payload ?: [];
        $receipt = $this->receiptPayload($responsePayload);

        return ElectricityTransaction::updateOrCreate(
            ['transaction_log_id' => $transactionLog->id],
            [
                'transaction_id' => $transactionLog->transaction_id ?: $this->firstValue($responsePayload, [
                    'receiptItems.external_reference_number',
                    'receiptItems.receipt_no',
                    'receiptItems.ReceiptNo',
                    'creditVendReceipt.receiptNo',
                ]),
                'amount' => $this->parseAmount($this->firstValue($responsePayload, [
                    'receiptItems.AmountTendered',
                    'receiptItems.totals.total',
                    'receiptItems.totals.tendered',
                    'creditVendReceipt.amtTendered',
                ]) ?: $transactionLog->amount),
                'meter_number' => $this->firstValue($responsePayload, [
                    'receiptItems.meter_details.number',
                    'creditVendReceipt.meterNumber',
                ]) ?: $transactionLog->meter_number ?: $this->firstValue($requestPayload, ['meterNumber', 'meter_number']),
                'account_number' => $this->firstValue($responsePayload, [
                    'receiptItems.customer_account_no',
                    'creditVendReceipt.account',
                ]),
                'status' => $status,
                'message' => $message,
                'customer_name' => $this->firstValue($responsePayload, [
                    'receiptItems.customer_name',
                    'receiptItems.utility_details.name',
                    'creditVendReceipt.name',
                    'details.customer_name',
                ]),
                'receipt_no' => $this->firstValue($receipt, [
                    'receipt_no',
                    'ReceiptNo',
                    'receiptNo',
                    'external_reference_number',
                ]),
                'units' => $this->firstValue($responsePayload, [
                    'receiptItems.totals.units',
                    'creditVendReceipt.tokenUnits',
                ]),
                'endpoint' => $transactionLog->endpoint,
                'request_ip' => $transactionLog->request_ip,
            ]
        );
    }

    private function normalizePayload($payload)
    {
        if (is_array($payload)) {
            return $payload;
        }

        if (is_object($payload)) {
            return json_decode(json_encode($payload), true) ?: [];
        }

        if (is_string($payload)) {
            $decoded = json_decode($payload, true);

            return is_array($decoded) ? $decoded : ['raw_body' => $payload];
        }

        if ($payload === null) {
            return [];
        }

        return ['value' => $payload];
    }

    private function sanitizePayload(array $payload)
    {
        $sensitiveKeys = [
            'authorization',
            'password',
            'credential',
            'api_token',
            'token',
            'elec_token',
            'bearer',
        ];

        foreach ($payload as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (in_array($normalizedKey, $sensitiveKeys, true)) {
                $payload[$key] = '[redacted]';
                continue;
            }

            if (is_array($value)) {
                $payload[$key] = $this->sanitizePayload($value);
            }
        }

        return $payload;
    }

    private function receiptPayload(array $payload)
    {
        $receipt = data_get($payload, 'receiptItems');

        if (is_array($receipt)) {
            return $receipt;
        }

        $creditVendReceipt = data_get($payload, 'creditVendReceipt');

        return is_array($creditVendReceipt) ? $creditVendReceipt : [];
    }

    private function extractStatus(array $responsePayload, array $errorPayload = null)
    {
        if ($errorPayload) {
            return 'FAILED';
        }

        $status = $this->firstValue($responsePayload, ['results', 'result', 'response', 'status']);

        if (!$status) {
            return 'UNKNOWN';
        }

        $status = strtoupper((string) $status);

        if ($status === 'SUCCESSFUL') {
            return 'SUCCESS';
        }

        return $status;
    }

    private function extractMessage(array $responsePayload, array $errorPayload = null)
    {
        return $this->firstValue($responsePayload, ['message'])
            ?: $this->firstValue($errorPayload ?: [], ['message'])
            ?: null;
    }

    private function firstValue(array $payload, array $keys)
    {
        foreach ($keys as $key) {
            $value = data_get($payload, $key);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function parseAmount($amount)
    {
        if ($amount === null || $amount === '') {
            return null;
        }

        if (is_numeric($amount)) {
            return number_format((float) $amount, 2, '.', '');
        }

        $amount = preg_replace('/[^0-9.\-]/', '', (string) $amount);

        return $amount === '' ? null : number_format((float) $amount, 2, '.', '');
    }
}
