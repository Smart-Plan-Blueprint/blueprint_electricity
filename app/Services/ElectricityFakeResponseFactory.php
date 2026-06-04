<?php

namespace App\Services;

class ElectricityFakeResponseFactory
{
    public function verifyCustomerPayload($meterNumber)
    {
        return [
            'name' => 'TEST CUSTOMER',
            'meterNumber' => (string) $meterNumber,
        ];
    }

    public function purchasePayload($meterNumber, $amount, $transactionId)
    {
        $amount = number_format((float) $amount, 2, '.', '');
        $receiptNo = 'TEST-' . preg_replace('/[^A-Za-z0-9_-]/', '', (string) $transactionId);
        $date = date('Y-m-d H:i:s');

        return [
            'results' => 'SUCCESS',
            'message' => null,
            'type' => 'DISPLAY',
            'testMode' => true,
            'receiptItems' => [
                'customer_address' => null,
                'notes' => [],
                'receipt_no' => $receiptNo,
                'DateTime' => $date,
                'utility_details' => [
                    'address' => null,
                    'vat_number' => null,
                    'name' => 'TEST CUSTOMER',
                    'contact_number' => null,
                ],
                'Cashier' => 'Smartblueprient',
                'reprint' => false,
                'customer_account_no' => 'TEST-ACCOUNT',
                'tariff_name' => 'Residential',
                'fee_details' => [
                    [
                        'amount' => '0.00',
                        'tax' => '0.00',
                        'desc' => 'Total Excise Duty',
                    ],
                    [
                        'amount' => '0.00',
                        'tax' => '0.00',
                        'desc' => 'Total VAT',
                    ],
                ],
                'customer_messages' => [
                    'Credit Vend',
                ],
                'totals' => [
                    'tendered' => $amount,
                    'fees' => '0.00',
                    'total' => $amount,
                    'fbe_units' => '',
                    'elec' => $amount,
                    'debt_remaining' => '0.00',
                    'tax' => '',
                    'units' => '0',
                    'debt' => '',
                    'debt_opening_bal' => '0.00',
                ],
                'fbe_tokens' => [],
                'external_client_id' => 'TEST',
                'customer_location_ref' => 'TEST LOCATION',
                'std_tokens' => [
                    [
                        'amount' => $amount,
                        'code' => '00000000000000000000',
                        'receipt' => $receiptNo,
                        'tax' => '0.00',
                        'tariff' => '',
                        'units' => '',
                        'sort_order' => '1',
                        'desc' => 'Test token',
                    ],
                ],
                'meter_details' => [
                    'tt' => '',
                    'number' => (string) $meterNumber,
                    'sgc_ti' => '000/000',
                    'ti' => '000',
                    'krn' => '000',
                    'alg' => '',
                    'sgc' => '000',
                ],
                'token_gen_time' => $date,
                'external_reference_number' => $receiptNo,
                'debt_details' => [],
                'tariff_blocks' => [],
                'ReceiptNo' => $receiptNo,
                'customer_name' => 'TEST CUSTOMER',
                'AmountTendered' => $amount,
            ],
        ];
    }
}
