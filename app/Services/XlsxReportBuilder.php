<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class XlsxReportBuilder
{
    private $transactionHeaders = ['Transaction ID', 'Amount', 'Meter Number', 'Merchant Name', 'Status', 'Date/Time'];
    private $airtimeHeaders     = ['Transaction ID', 'Amount', 'Phone Number', 'Product', 'Merchant', 'Status', 'Date/Time'];
    private $outletId           = '3928-01';
    private $outletName         = 'SCBBB';
    private $electricityUser    = 'Smart Plan Blueprint-01';
    private $electricityProvider = 'Botswana Power Corporation';

    public function build(array $report)
    {
        $rows = collect($report['rows'] ?? [])->map(function ($row) {
            return $this->normalizeRow($row);
        });
        $from = $report['from'];
        $to = $report['to'];

        $generatedAt = now(config('app.timezone'));
        $dateRange = $from->toDateString() . ' to ' . $to->toDateString();

        $successful = $rows->filter(function ($row) {
            return $row['status'] === 'SUCCESS' || $row['status'] === 'SUCCESSFUL';
        })->values();
        $failed = $rows->filter(function ($row) {
            return $row['status'] === 'FAILED';
        })->values();

        $zip = new StoredZipWriter();
        $zip->add('[Content_Types].xml', $this->contentTypes());
        $zip->add('_rels/.rels', $this->rootRels());
        $zip->add('docProps/app.xml', $this->appXml());
        $zip->add('docProps/core.xml', $this->coreXml($generatedAt));
        $zip->add('xl/workbook.xml', $this->workbook());
        $zip->add('xl/_rels/workbook.xml.rels', $this->workbookRels());
        $zip->add('xl/styles.xml', $this->styles());
        $airtimeRows = collect($report['airtime_rows'] ?? [])->map(fn($r) => $this->normalizeAirtimeRow($r));
        $salesRows = $this->salesRows($rows, $airtimeRows);

        $zip->add('xl/worksheets/sheet1.xml', $this->transactionSheet('Transaction Report', $dateRange, $generatedAt, $rows));
        $zip->add('xl/worksheets/sheet2.xml', $this->transactionSheet('Successful Transactions', $dateRange, $generatedAt, $successful));
        $zip->add('xl/worksheets/sheet3.xml', $this->transactionSheet('Failed Transactions', $dateRange, $generatedAt, $failed));
        $zip->add('xl/worksheets/sheet4.xml', $this->summarySheet($dateRange, $generatedAt, $this->dailySummary($rows)));
        $zip->add('xl/worksheets/sheet5.xml', $this->airtimeSheet($dateRange, $generatedAt, $airtimeRows));
        $zip->add('xl/worksheets/sheet6.xml', $this->salesByDateSheet($dateRange, $generatedAt, $salesRows));
        $zip->add('xl/worksheets/sheet7.xml', $this->salesByOutletSheet($dateRange, $generatedAt, $salesRows));
        $zip->add('xl/worksheets/sheet8.xml', $this->salesByUserSheet($dateRange, $generatedAt, $salesRows));
        $zip->add('xl/worksheets/sheet9.xml', $this->salesByProviderSheet($dateRange, $generatedAt, $salesRows));
        $zip->add('xl/worksheets/sheet10.xml', $this->itemisedSalesSheet($dateRange, $generatedAt, $salesRows));
        $zip->add('xl/worksheets/sheet11.xml', $this->merchantStatementSheet($dateRange, $generatedAt, $salesRows));

        return $zip->finish();
    }

    public function fileName(Carbon $from, Carbon $to)
    {
        return 'transaction-report-daily-' . $from->toDateString() . '-' . $to->toDateString() . '.xlsx';
    }

    private function normalizeRow($row)
    {
        return [
            'transaction_id' => (string) ($row['transaction_id'] ?? ''),
            'amount' => (float) ($row['amount'] ?? 0),
            'meter_number' => (string) ($row['meter_number'] ?? ''),
            'merchant_name' => (string) ($row['merchant_name'] ?? 'Smart Plan Blueprint'),
            'status' => strtoupper((string) ($row['status'] ?? 'UNKNOWN')),
            'created_at' => (string) ($row['created_at'] ?? ''),
        ];
    }

    private function transactionSheet($title, $dateRange, Carbon $generatedAt, Collection $rows)
    {
        $body = '';
        $rowIndex = 7;
        foreach ($rows as $row) {
            $body .= $this->rowXml($rowIndex, [
                $this->textCell('A', $rowIndex, $row['transaction_id'], 5),
                $this->numberCell('B', $rowIndex, $row['amount'], 6),
                $this->textCell('C', $rowIndex, $row['meter_number'], 5),
                $this->textCell('D', $rowIndex, $row['merchant_name'], 5),
                $this->textCell('E', $rowIndex, $row['status'], $this->statusStyle($row['status'])),
                $this->textCell('F', $rowIndex, $row['created_at'], 5),
            ]);
            $rowIndex++;
        }

        $header = '';
        foreach ($this->transactionHeaders as $index => $label) {
            $header .= $this->textCell($this->columnLetter($index), 6, $label, 4);
        }

        $rowsXml = $this->rowXml(1, [$this->textCell('A', 1, 'Smart Plan Blueprint', 1)])
            . $this->rowXml(2, [$this->textCell('A', 2, $title, 2)])
            . $this->rowXml(3, [$this->textCell('A', 3, 'Daily Transaction Report | ' . $dateRange, 3)])
            . $this->rowXml(4, [$this->textCell('A', 4, 'Generated: ' . $this->formatGeneratedAt($generatedAt), 3)])
            . $this->rowXml(6, [$header])
            . $body;

        return $this->worksheet(
            [34.83203125, 15.83203125, 18.83203125, 26.83203125, 14.83203125, 24.83203125],
            ['A1:F1', 'A2:F2', 'A3:F3', 'A4:F4'],
            $rowsXml
        );
    }

    private function normalizeAirtimeRow($row): array
    {
        return [
            'transaction_id' => (string) ($row['transaction_id'] ?? ''),
            'amount'         => (float)  ($row['amount'] ?? 0),
            'phonenumber'    => (string) ($row['phonenumber'] ?? ''),
            'product_name'   => (string) ($row['product_name'] ?? ''),
            'merchant_name'  => (string) ($row['merchant_name'] ?? ''),
            'status'         => strtoupper((string) ($row['status'] ?? 'UNKNOWN')),
            'created_at'     => (string) ($row['created_at'] ?? ''),
        ];
    }

    private function airtimeSheet($dateRange, Carbon $generatedAt, Collection $rows)
    {
        $body = '';
        $rowIndex = 7;
        foreach ($rows as $row) {
            $body .= $this->rowXml($rowIndex, [
                $this->textCell('A', $rowIndex, $row['transaction_id'], 5),
                $this->numberCell('B', $rowIndex, $row['amount'], 6),
                $this->textCell('C', $rowIndex, $row['phonenumber'], 5),
                $this->textCell('D', $rowIndex, $row['product_name'], 5),
                $this->textCell('E', $rowIndex, $row['merchant_name'], 5),
                $this->textCell('F', $rowIndex, $row['status'], $this->statusStyle($row['status'])),
                $this->textCell('G', $rowIndex, $row['created_at'], 5),
            ]);
            $rowIndex++;
        }

        $header = '';
        foreach ($this->airtimeHeaders as $index => $label) {
            $header .= $this->textCell($this->columnLetter($index), 6, $label, 4);
        }

        $rowsXml = $this->rowXml(1, [$this->textCell('A', 1, 'Smart Plan Blueprint', 1)])
            . $this->rowXml(2, [$this->textCell('A', 2, 'Airtime Transactions', 2)])
            . $this->rowXml(3, [$this->textCell('A', 3, 'Daily Report | ' . $dateRange, 3)])
            . $this->rowXml(4, [$this->textCell('A', 4, 'Generated: ' . $this->formatGeneratedAt($generatedAt), 3)])
            . $this->rowXml(6, [$header])
            . $body;

        return $this->worksheet(
            [34.83, 15.83, 18.83, 24.83, 22.83, 14.83, 24.83],
            ['A1:G1', 'A2:G2', 'A3:G3', 'A4:G4'],
            $rowsXml
        );
    }

    private function salesByDateSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $rows = [];
        foreach ($this->groupSales($salesRows, ['date']) as $row) {
            $rows[] = [$row['date'], $row['amount']];
        }
        $rows[] = ['Sales Totals', $this->sumSales($salesRows)];

        return $this->tableSheet(
            'Sales By Date',
            $dateRange,
            $generatedAt,
            ['Date', 'Amount'],
            $rows,
            [24.83, 15.83],
            [1]
        );
    }

    private function salesByOutletSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $rows = [];
        foreach ($this->groupSales($salesRows, ['outlet_id', 'outlet_name']) as $row) {
            $rows[] = [$row['outlet_id'], $row['outlet_name'], $row['amount']];
        }
        $rows[] = ['Sales Totals', '', $this->sumSales($salesRows)];

        return $this->tableSheet(
            'Sales By Outlet',
            $dateRange,
            $generatedAt,
            ['Outlet Id', 'Outlet Name', 'Amount'],
            $rows,
            [18.83, 28.83, 15.83],
            [2]
        );
    }

    private function salesByUserSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $rows = [];
        foreach ($this->groupSales($salesRows, ['user_id', 'user_name']) as $row) {
            $rows[] = [$row['user_id'], $row['user_name'], $row['amount']];
        }
        $rows[] = ['Sales Totals', '', $this->sumSales($salesRows)];

        return $this->tableSheet(
            'Sales By User',
            $dateRange,
            $generatedAt,
            ['User Id', 'Name', 'Amount'],
            $rows,
            [30.83, 22.83, 15.83],
            [2]
        );
    }

    private function salesByProviderSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $rows = [];
        foreach ($this->groupSales($salesRows, ['sale_type', 'provider']) as $row) {
            $rows[] = [$row['sale_type'], $row['provider'], $row['amount']];
        }
        $rows[] = ['Sales Totals', '', $this->sumSales($salesRows)];

        return $this->tableSheet(
            'Sales By Provider',
            $dateRange,
            $generatedAt,
            ['Sale Type', 'Provider', 'Amount'],
            $rows,
            [18.83, 34.83, 15.83],
            [2]
        );
    }

    private function itemisedSalesSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $rows = $salesRows
            ->sortBy('date_time')
            ->values()
            ->map(function ($row) {
                return [
                    $row['date_time'],
                    trim($row['user_id'] . ' - ' . $row['user_name'], ' -'),
                    $row['sale_type'],
                    $row['provider'],
                    $row['reference'],
                    $row['amount'],
                ];
            })
            ->all();

        $rows[] = ['Sales Totals', '', '', '', '', $this->sumSales($salesRows)];

        return $this->tableSheet(
            'Itemised Sales',
            $dateRange,
            $generatedAt,
            ['Date Time', 'User', 'Sale Type', 'Provider', 'Meter Number', 'Amount'],
            $rows,
            [24.83, 34.83, 18.83, 32.83, 20.83, 15.83],
            [5]
        );
    }

    private function merchantStatementSheet($dateRange, Carbon $generatedAt, Collection $salesRows)
    {
        $totalSales = $this->sumSales($salesRows);
        $providerRows = $this->groupSales($salesRows, ['sale_type', 'provider']);
        $commissionTotal = 0.0;

        $rowsXml = $this->rowXml(1, [$this->textCell('A', 1, 'Smart Plan Blueprint', 1)])
            . $this->rowXml(2, [$this->textCell('A', 2, 'Merchant Statement', 2)])
            . $this->rowXml(3, [$this->textCell('A', 3, 'Date Range: ' . $dateRange, 3)])
            . $this->rowXml(4, [$this->textCell('A', 4, 'Generated: ' . $this->formatGeneratedAt($generatedAt), 3)])
            . $this->rowXml(6, [$this->textCell('A', 6, 'Merchant Summary Statement', 2)])
            . $this->rowXml(7, [$this->textCell('A', 7, 'Item', 4), $this->textCell('B', 7, 'Amount', 4)])
            . $this->rowXml(8, [$this->textCell('A', 8, 'Total Sales', 5), $this->numberCell('B', 8, $totalSales, 6)])
            . $this->rowXml(9, [$this->textCell('A', 9, 'Deposits', 5), $this->textCell('B', 9, 'Not tracked in portal', 5)])
            . $this->rowXml(10, [$this->textCell('A', 10, 'Closing Balance', 5), $this->textCell('B', 10, 'Not tracked in portal', 5)])
            . $this->rowXml(12, [$this->textCell('A', 12, 'Outlet Sales', 2)])
            . $this->rowXml(13, [
                $this->textCell('A', 13, 'Outlet Id', 4),
                $this->textCell('B', 13, 'Outlet Name', 4),
                $this->textCell('C', 13, 'Sales', 4),
            ])
            . $this->rowXml(14, [
                $this->textCell('A', 14, $this->outletId, 5),
                $this->textCell('B', 14, $this->outletName, 5),
                $this->numberCell('C', 14, $totalSales, 6),
            ])
            . $this->rowXml(16, [$this->textCell('A', 16, 'Merchant Commission Earned', 2)])
            . $this->rowXml(17, [
                $this->textCell('A', 17, 'Product Type', 4),
                $this->textCell('B', 17, 'Sales', 4),
                $this->textCell('C', 17, 'Commission Rate', 4),
                $this->textCell('D', 17, 'Commission Amount', 4),
            ]);

        $rowIndex = 18;
        foreach ($providerRows as $row) {
            $rate = $this->commissionRate($row['sale_type']);
            $commission = $row['amount'] * $rate;
            $commissionTotal += $commission;

            $rowsXml .= $this->rowXml($rowIndex, [
                $this->textCell('A', $rowIndex, $row['sale_type'] . ' - ' . $row['provider'], 5),
                $this->numberCell('B', $rowIndex, $row['amount'], 6),
                $this->textCell('C', $rowIndex, $rate ? ($rate * 100) . '%' : '', 5),
                $this->numberCell('D', $rowIndex, $commission, 6),
            ]);
            $rowIndex++;
        }

        $rowsXml .= $this->rowXml($rowIndex, [
            $this->textCell('A', $rowIndex, 'Total Commission', 4),
            $this->numberCell('B', $rowIndex, $totalSales, 6),
            $this->textCell('C', $rowIndex, '', 4),
            $this->numberCell('D', $rowIndex, $commissionTotal, 6),
        ]);

        return $this->worksheet(
            [34.83, 18.83, 18.83, 20.83],
            ['A1:D1', 'A2:D2', 'A3:D3', 'A4:D4', 'A6:D6', 'A12:D12', 'A16:D16'],
            $rowsXml
        );
    }

    private function tableSheet($title, $dateRange, Carbon $generatedAt, array $headers, array $rows, array $widths, array $amountColumns = [], array $numberColumns = [])
    {
        $header = '';
        foreach ($headers as $index => $label) {
            $header .= $this->textCell($this->columnLetter($index), 6, $label, 4);
        }

        $body = '';
        $rowIndex = 7;
        foreach ($rows as $row) {
            $cells = [];
            foreach ($row as $index => $value) {
                $column = $this->columnLetter($index);
                if (is_int($value) || is_float($value)) {
                    $style = in_array($index, $amountColumns, true) ? 6 : 5;
                    $cells[] = $this->numberCell($column, $rowIndex, $value, $style);
                } elseif (in_array($index, $numberColumns, true) && is_numeric($value)) {
                    $cells[] = $this->numberCell($column, $rowIndex, $value, 5);
                } else {
                    $cells[] = $this->textCell($column, $rowIndex, $value, 5);
                }
            }
            $body .= $this->rowXml($rowIndex, $cells);
            $rowIndex++;
        }

        $lastColumn = $this->columnLetter(count($headers) - 1);
        $rowsXml = $this->rowXml(1, [$this->textCell('A', 1, 'Smart Plan Blueprint', 1)])
            . $this->rowXml(2, [$this->textCell('A', 2, $title, 2)])
            . $this->rowXml(3, [$this->textCell('A', 3, 'Date Range: ' . $dateRange, 3)])
            . $this->rowXml(4, [$this->textCell('A', 4, 'Generated: ' . $this->formatGeneratedAt($generatedAt), 3)])
            . $this->rowXml(6, [$header])
            . $body;

        return $this->worksheet(
            $widths,
            ['A1:' . $lastColumn . '1', 'A2:' . $lastColumn . '2', 'A3:' . $lastColumn . '3', 'A4:' . $lastColumn . '4'],
            $rowsXml
        );
    }

    private function summarySheet($dateRange, Carbon $generatedAt, array $rows)
    {
        $headers = ['Period', 'Transactions', 'Successful', 'Failed', 'Pending', 'Other', 'Successful Amount'];

        $body = '';
        $rowIndex = 8;
        foreach ($rows as $row) {
            $body .= $this->rowXml($rowIndex, [
                $this->textCell('A', $rowIndex, $row['period'], 5),
                $this->numberCell('B', $rowIndex, $row['transactions'], 5),
                $this->numberCell('C', $rowIndex, $row['successful'], 5),
                $this->numberCell('D', $rowIndex, $row['failed'], 5),
                $this->numberCell('E', $rowIndex, $row['pending'], 5),
                $this->numberCell('F', $rowIndex, $row['other'], 5),
                $this->numberCell('G', $rowIndex, $row['successful_amount'], 6),
            ]);
            $rowIndex++;
        }

        $header = '';
        foreach ($headers as $index => $label) {
            $header .= $this->textCell($this->columnLetter($index), 7, $label, 4);
        }

        $rowsXml = $this->rowXml(1, [$this->textCell('A', 1, 'Smart Plan Blueprint', 1)])
            . $this->rowXml(2, [$this->textCell('A', 2, 'Daily Transaction Report', 2)])
            . $this->rowXml(3, [$this->textCell('A', 3, 'Date Range: ' . $dateRange, 3)])
            . $this->rowXml(4, [$this->textCell('A', 4, 'Generated: ' . $this->formatGeneratedAt($generatedAt), 3)])
            . $this->rowXml(6, [$this->textCell('A', 6, 'Summary Overview', 2)])
            . $this->rowXml(7, [$header])
            . $body;

        return $this->worksheet(
            [26.83203125, 15.83203125, 14.83203125, 12.83203125, 12.83203125, 12.83203125, 18.83203125],
            ['A1:G1', 'A2:G2', 'A3:G3', 'A4:G4', 'A6:G6'],
            $rowsXml
        );
    }

    private function salesRows(Collection $electricityRows, Collection $airtimeRows)
    {
        $electricity = $electricityRows->map(function ($row) {
            return [
                'date_time'   => $row['created_at'],
                'date'        => $this->datePart($row['created_at']),
                'outlet_id'   => $this->outletId,
                'outlet_name' => $this->outletName,
                'user_id'     => $this->electricityUser,
                'user_name'   => 'Not Set',
                'sale_type'   => 'Electricity',
                'provider'    => $this->electricityProvider,
                'reference'   => $row['meter_number'],
                'amount'      => (float) $row['amount'],
                'status'      => $row['status'],
            ];
        });

        $airtime = $airtimeRows->map(function ($row) {
            $merchant = $row['merchant_name'] ?: $this->electricityUser;

            return [
                'date_time'   => $row['created_at'],
                'date'        => $this->datePart($row['created_at']),
                'outlet_id'   => $this->outletId,
                'outlet_name' => $this->outletName,
                'user_id'     => $merchant,
                'user_name'   => 'Not Set',
                'sale_type'   => 'Airtime',
                'provider'    => $row['product_name'] ?: 'Airtime',
                'reference'   => $row['phonenumber'],
                'amount'      => (float) $row['amount'],
                'status'      => $row['status'],
            ];
        });

        return $electricity
            ->merge($airtime)
            ->filter(function ($row) {
                return $this->isSuccess($row['status']);
            })
            ->values();
    }

    private function groupSales(Collection $salesRows, array $keys)
    {
        $groups = [];

        foreach ($salesRows as $row) {
            $groupKey = implode('|', array_map(function ($key) use ($row) {
                return $row[$key] ?? '';
            }, $keys));

            if (!isset($groups[$groupKey])) {
                $groups[$groupKey] = ['amount' => 0.0];
                foreach ($keys as $key) {
                    $groups[$groupKey][$key] = $row[$key] ?? '';
                }
            }

            $groups[$groupKey]['amount'] += (float) $row['amount'];
        }

        ksort($groups);

        return array_values($groups);
    }

    private function sumSales(Collection $salesRows)
    {
        return (float) $salesRows->sum('amount');
    }

    private function datePart($value)
    {
        $date = substr((string) $value, 0, 10);
        return $date !== '' ? $date : 'Undated';
    }

    private function isSuccess($status)
    {
        $status = strtoupper((string) $status);
        return $status === 'SUCCESS' || $status === 'SUCCESSFUL';
    }

    private function commissionRate($saleType)
    {
        $saleType = strtolower((string) $saleType);

        if ($saleType === 'airtime') {
            return 0.09;
        }

        if ($saleType === 'electricity') {
            return 0.035;
        }

        return 0.0;
    }

    private function dailySummary(Collection $rows)
    {
        $map = [];

        foreach ($rows as $row) {
            $period = $row['created_at'] !== '' ? substr($row['created_at'], 0, 10) : 'Undated';
            $status = $row['status'];

            if (!isset($map[$period])) {
                $map[$period] = [
                    'period' => $period,
                    'transactions' => 0,
                    'successful' => 0,
                    'failed' => 0,
                    'pending' => 0,
                    'other' => 0,
                    'successful_amount' => 0.0,
                ];
            }

            $map[$period]['transactions']++;

            if ($status === 'SUCCESS' || $status === 'SUCCESSFUL') {
                $map[$period]['successful']++;
                $map[$period]['successful_amount'] += $row['amount'];
            } elseif ($status === 'FAILED') {
                $map[$period]['failed']++;
            } elseif ($status === 'PENDING') {
                $map[$period]['pending']++;
            } else {
                $map[$period]['other']++;
            }
        }

        ksort($map);

        return array_values($map);
    }

    private function worksheet(array $cols, array $merges, $rowsXml)
    {
        $colXml = '';
        foreach ($cols as $index => $width) {
            $colXml .= '<col min="' . ($index + 1) . '" max="' . ($index + 1) . '" width="' . $width . '" customWidth="1"/>';
        }

        $mergeXml = '';
        foreach ($merges as $ref) {
            $mergeXml .= '<mergeCell ref="' . $ref . '"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<cols>' . $colXml . '</cols>'
            . '<sheetData>' . $rowsXml . '</sheetData>'
            . '<mergeCells count="' . count($merges) . '">' . $mergeXml . '</mergeCells>'
            . '</worksheet>';
    }

    private function rowXml($index, array $cells)
    {
        return '<row r="' . $index . '">' . implode('', $cells) . '</row>';
    }

    private function textCell($column, $row, $value, $style)
    {
        return '<c r="' . $column . $row . '" s="' . $style . '" t="inlineStr"><is><t xml:space="preserve">' . $this->xml($value) . '</t></is></c>';
    }

    private function numberCell($column, $row, $value, $style)
    {
        return '<c r="' . $column . $row . '" s="' . $style . '"><v>' . (0 + $value) . '</v></c>';
    }

    private function statusStyle($status)
    {
        if ($status === 'SUCCESS' || $status === 'SUCCESSFUL') {
            return 7;
        }
        if ($status === 'FAILED') {
            return 8;
        }
        if ($status === 'PENDING') {
            return 9;
        }

        return 5;
    }

    private function columnLetter($index)
    {
        return chr(65 + $index);
    }

    private function formatGeneratedAt(Carbon $date)
    {
        return $date->format('d/m/Y H:i:s');
    }

    private function sheetNames()
    {
        return [
            'Transactions',
            'Successful',
            'Failed',
            'Summary',
            'Airtime',
            'Sales By Date',
            'Sales By Outlet',
            'Sales By User',
            'Sales By Provider',
            'Itemised Sales',
            'Merchant Statement',
        ];
    }

    private function workbook()
    {
        $sheets = '';
        foreach ($this->sheetNames() as $index => $name) {
            $sheetId = $index + 1;
            $sheets .= '<sheet name="' . $this->xml($name) . '" sheetId="' . $sheetId . '" r:id="rId' . $sheetId . '"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets>' . $sheets . '</sheets></workbook>';
    }

    private function workbookRels()
    {
        $relationships = '';
        foreach ($this->sheetNames() as $index => $name) {
            $sheetId = $index + 1;
            $relationships .= '<Relationship Id="rId' . $sheetId . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $sheetId . '.xml"/>';
        }

        $styleId = count($this->sheetNames()) + 1;

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . $relationships
            . '<Relationship Id="rId' . $styleId . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>';
    }

    private function contentTypes()
    {
        $worksheetOverrides = '';
        foreach ($this->sheetNames() as $index => $name) {
            $sheetId = $index + 1;
            $worksheetOverrides .= '<Override PartName="/xl/worksheets/sheet' . $sheetId . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . $worksheetOverrides
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            . '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            . '</Types>';
    }

    private function rootRels()
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            . '</Relationships>';
    }

    private function styles()
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<fonts count="5">'
            . '<font><sz val="11"/><color rgb="FF071A33"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="14"/><color rgb="FF071A33"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FF071A33"/><name val="Calibri"/></font>'
            . '</fonts>'
            . '<fills count="8">'
            . '<fill><patternFill patternType="none"/></fill>'
            . '<fill><patternFill patternType="gray125"/></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FF071A33"/><bgColor indexed="64"/></patternFill></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FF"/><bgColor indexed="64"/></patternFill></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FF1D5FD1"/><bgColor indexed="64"/></patternFill></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFDCEAFF"/><bgColor indexed="64"/></patternFill></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFFFE8E8"/><bgColor indexed="64"/></patternFill></fill>'
            . '</fills>'
            . '<borders count="2">'
            . '<border><left/><right/><top/><bottom/><diagonal/></border>'
            . '<border><left style="thin"><color rgb="FFD7E2F3"/></left><right style="thin"><color rgb="FFD7E2F3"/></right><top style="thin"><color rgb="FFD7E2F3"/></top><bottom style="thin"><color rgb="FFD7E2F3"/></bottom><diagonal/></border>'
            . '</borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="10">'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
            . '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFill="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyBorder="1"/>'
            . '<xf numFmtId="2" fontId="0" fillId="5" borderId="1" applyBorder="1" applyNumberFormat="1"/>'
            . '<xf numFmtId="0" fontId="4" fillId="6" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="4" fillId="7" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '<xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>'
            . '</cellXfs>'
            . '</styleSheet>';
    }

    private function coreXml(Carbon $date)
    {
        $iso = $date->copy()->utc()->format('Y-m-d\TH:i:s\Z');

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            . '<dc:creator>Smart Plan Blueprint</dc:creator>'
            . '<cp:lastModifiedBy>Smart Plan Blueprint</cp:lastModifiedBy>'
            . '<dcterms:created xsi:type="dcterms:W3CDTF">' . $iso . '</dcterms:created>'
            . '<dcterms:modified xsi:type="dcterms:W3CDTF">' . $iso . '</dcterms:modified>'
            . '</cp:coreProperties>';
    }

    private function appXml()
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
            . '<Application>Smart Plan Blueprint Portal</Application>'
            . '</Properties>';
    }

    private function xml($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}

class StoredZipWriter
{
    private $files = [];

    public function add($name, $contents)
    {
        $this->files[] = ['name' => str_replace('\\', '/', $name), 'contents' => (string) $contents];
    }

    public function finish()
    {
        $data = '';
        $central = '';
        $offset = 0;

        foreach ($this->files as $file) {
            $name = $file['name'];
            $contents = $file['contents'];
            $crc = crc32($contents);
            $size = strlen($contents);
            $nameLength = strlen($name);

            $local = pack('VvvvvvVVVvv', 0x04034b50, 20, 0, 0, 0, 0, $crc, $size, $size, $nameLength, 0) . $name . $contents;
            $data .= $local;

            $central .= pack('VvvvvvvVVVvvvvvVV', 0x02014b50, 20, 20, 0, 0, 0, 0, $crc, $size, $size, $nameLength, 0, 0, 0, 0, 32, $offset) . $name;
            $offset += strlen($local);
        }

        $centralOffset = strlen($data);
        $centralSize = strlen($central);
        $count = count($this->files);
        $end = pack('VvvvvVVv', 0x06054b50, 0, 0, $count, $count, $centralSize, $centralOffset, 0);

        return $data . $central . $end;
    }
}
