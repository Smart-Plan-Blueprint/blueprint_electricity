<?php

namespace Tests\Unit;

use App\Services\XlsxReportBuilder;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class XlsxReportBuilderTest extends TestCase
{
    public function test_workbook_has_expected_sheets_and_no_account_number_header()
    {
        $builder = new XlsxReportBuilder();
        $workbook = $builder->build([
            'from' => Carbon::parse('2026-06-07', 'Africa/Gaborone')->startOfDay(),
            'to' => Carbon::parse('2026-06-07', 'Africa/Gaborone')->endOfDay(),
            'rows' => collect([
                [
                    'transaction_id' => 'tx-1',
                    'amount' => 10,
                    'meter_number' => '123',
                    'merchant_name' => 'Smart Plan Blueprint',
                    'status' => 'SUCCESS',
                    'created_at' => '2026-06-07 08:00:00',
                ],
            ]),
            'summary' => [
                'total_count' => 1,
                'success_count' => 1,
                'failed_count' => 0,
                'pending_count' => 0,
                'success_rate' => 100,
                'total_amount' => 10,
                'failed_amount' => 0,
            ],
        ]);

        $this->assertStringStartsWith('PK', $workbook);
        $this->assertStringContainsString('Transactions', $workbook);
        $this->assertStringContainsString('Successful', $workbook);
        $this->assertStringContainsString('Failed', $workbook);
        $this->assertStringContainsString('Summary', $workbook);
        $this->assertStringContainsString('Meter Number', $workbook);
        $this->assertStringNotContainsString('Account Number', $workbook);
    }
}
