<?php

namespace App\Http\Controllers;

use App\Models\ElectricityTransaction;
use Illuminate\Http\Request;

class TransactionLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ElectricityTransaction::query()->latest();

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

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
        $transactions = $query->paginate($perPage);

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
        ]);
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
            'created_at' => optional($transaction->created_at)->toDateTimeString(),
        ];
    }
}
