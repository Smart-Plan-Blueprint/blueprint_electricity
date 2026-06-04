<?php

namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ElectricityProxyController extends Controller
{
    public function purchaseElectricity(Request $request)
    {
        $startedAt = microtime(true);
        $payload = $this->purchasePayload($request);
        $context = $this->logContext($request, $payload);

        Log::info('Electricity purchase proxy request started', $context + [
            'fake' => config('electricity_proxy.fake'),
        ]);

        $validator = Validator::make($payload, [
            'meterNumber' => 'required',
            'transactionAmount' => 'required|numeric|min:1',
            'clientSaleId' => 'required',
            'createdBy' => 'required',
        ]);22

        if ($validator->fails()) {
            Log::warning('Electricity purchase proxy validation failed', $context + [
                'errors' => $validator->errors()->keys(),
                'durationMs' => $this->durationMs($startedAt),
            ]);

            return response()->json([
                'results' => 'FAILED',
                'message' => 'Please provide meterNumber, transactionAmount, clientSaleId, and createdBy.',
                'details' => $validator->errors(),
            ], 422);
        }

        if (config('electricity_proxy.fake')) {
            Log::info('Electricity purchase proxy fake response returned', $context + [
                'durationMs' => $this->durationMs($startedAt),
            ]);

            return $this->fakePurchaseResponse($payload);
        }

        $providerUrl = config('electricity_proxy.provider_url');
        $providerAuthorization = config('electricity_proxy.provider_authorization');

        if (!$providerUrl || !$providerAuthorization) {
            Log::warning('Electricity proxy is missing provider configuration', $context + [
                'hasProviderUrl' => (bool) $providerUrl,
                'hasProviderAuthorization' => (bool) $providerAuthorization,
            ]);

            return response()->json([
                'results' => 'FAILED',
                'message' => 'Electricity purchase service is not configured. Please try again later.',
                'details' => null,
            ], 500);
        }

        $client = new Client([
            'http_errors' => false,
            'timeout' => 60,
        ]);

        $options = [
            'query' => $request->query(),
            'json' => $payload,
            'headers' => [
                'Accept' => $request->header('Accept', 'application/json'),
                'Authorization' => $providerAuthorization,
            ],
        ];

        try {
            $response = $client->request('POST', $providerUrl, $options);

            Log::info('Electricity purchase provider response received', $context + [
                'statusCode' => $response->getStatusCode(),
                'durationMs' => $this->durationMs($startedAt),
            ]);

            return response($response->getBody()->getContents(), $response->getStatusCode())
                ->header('Content-Type', $response->getHeaderLine('Content-Type') ?: 'application/json');
        } catch (\Throwable $e) {
            Log::error('Electricity provider request failed', $context + [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'durationMs' => $this->durationMs($startedAt),
            ]);

            return response()->json([
                'results' => 'FAILED',
                'message' => 'Unable to contact the electricity purchase provider. Please try again later.',
                'details' => null,
            ], 502);
        }
    }

    private function fakePurchaseResponse(array $payload)
    {
        $amount = number_format((float) $payload['transactionAmount'], 2, '.', '');
        $receiptNo = 'TEST-' . preg_replace('/[^A-Za-z0-9_-]/', '', (string) $payload['clientSaleId']);

        return response()->json([
            'response' => 'Successful',
            'message' => 'Test mode response only. No provider request was sent.',
            'testMode' => true,
            'creditVendReceipt' => [
                'receiptNo' => $receiptNo,
                'date' => date('Y-m-d H:i:s'),
                'name' => 'TEST CUSTOMER',
                'account' => 'TEST-ACCOUNT',
                'tariff' => 'Residential',
                'standardCharge' => '0.00',
                'governmentLevy' => '0.00',
                'vat' => '0.00',
                'amtTendered' => $amount,
                'costUnits' => $amount,
                'tokenUnits' => '0',
                'stsCipher' => '0000 0000 0000 0000',
                'meterNumber' => (string) $payload['meterNumber'],
                'sgc' => '000',
                'ti' => '000',
                'krn' => '000',
                'location' => 'TEST LOCATION',
            ],
        ]);
    }

    private function purchasePayload(Request $request)
    {
        $payload = $request->json()->all() ?: $request->request->all();

        if (!isset($payload['transactionAmount']) && isset($payload['amount'])) {
            $payload['transactionAmount'] = $payload['amount'];
        }

        return $payload;
    }

    private function logContext(Request $request, array $payload)
    {
        return [
            'clientSaleId' => $payload['clientSaleId'] ?? null,
            'meterNumber' => $this->maskMeterNumber($payload['meterNumber'] ?? null),
            'transactionAmount' => $payload['transactionAmount'] ?? null,
            'ip' => $request->ip(),
        ];
    }

    private function maskMeterNumber($meterNumber)
    {
        if (!$meterNumber) {
            return null;
        }

        $meterNumber = (string) $meterNumber;
        $visibleDigits = substr($meterNumber, -4);

        return str_repeat('*', max(strlen($meterNumber) - 4, 0)) . $visibleDigits;
    }

    private function durationMs($startedAt)
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
