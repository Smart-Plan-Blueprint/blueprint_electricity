<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class XlsxReportBuilder
{
    public function build(array $report)
    {
        $rows = collect($report['rows'] ?? []);
        $summary = $report['summary'] ?? [];
        $from = $report['from'];
        $to = $report['to'];

        $sheets = [
            'Transactions' => $this->transactionRows($rows),
            'Successful' => $this->transactionRows($rows->filter(function ($row) {
                return in_array(strtoupper((string) $row['status']), ['SUCCESS', 'SUCCESSFUL'], true);
            })),
            'Failed' => $this->transactionRows($rows->filter(function ($row) {
                return strtoupper((string) $row['status']) === 'FAILED';
            })),
            'Summary' => $this->summaryRows($summary, $from, $to),
        ];

        $zip = new StoredZipWriter();
        $zip->add('[Content_Types].xml', $this->contentTypes(count($sheets)));
        $zip->add('_rels/.rels', $this->rootRels());
        $zip->add('xl/workbook.xml', $this->workbook(array_keys($sheets)));
        $zip->add('xl/_rels/workbook.xml.rels', $this->workbookRels(count($sheets)));
        $zip->add('xl/styles.xml', $this->styles());

        $index = 1;
        foreach ($sheets as $name => $sheetRows) {
            $zip->add("xl/worksheets/sheet{$index}.xml", $this->worksheet($sheetRows));
            $index++;
        }

        return $zip->finish();
    }

    public function fileName(Carbon $from, Carbon $to)
    {
        return 'transaction-report-daily-' . $from->toDateString() . '-' . $to->toDateString() . '.xlsx';
    }

    private function transactionRows(Collection $rows)
    {
        return collect([
            ['Smart Plan Blueprint'],
            ['Daily Transaction Report'],
            ['Generated', now()->toDateTimeString()],
            [],
            ['Transaction ID', 'Amount', 'Meter Number', 'Merchant Name', 'Status', 'Date/Time'],
        ])->merge($rows->map(function ($row) {
            return [
                $row['transaction_id'] ?: 'N/A',
                (float) $row['amount'],
                $row['meter_number'] ?: 'N/A',
                $row['merchant_name'] ?: 'Smart Plan Blueprint',
                $row['status'] ?: 'UNKNOWN',
                $row['created_at'] ?: 'N/A',
            ];
        }))->all();
    }

    private function summaryRows(array $summary, Carbon $from, Carbon $to)
    {
        return [
            ['Smart Plan Blueprint'],
            ['Daily Transaction Summary'],
            ['Date range', $from->toDateString() . ' to ' . $to->toDateString()],
            ['Generated', now()->toDateTimeString()],
            [],
            ['Metric', 'Value'],
            ['Total transactions', $summary['total_count'] ?? 0],
            ['Successful transactions', $summary['success_count'] ?? 0],
            ['Failed transactions', $summary['failed_count'] ?? 0],
            ['Pending / other transactions', $summary['pending_count'] ?? 0],
            ['Success rate', ($summary['success_rate'] ?? 0) . '%'],
            ['Successful amount', (float) ($summary['total_amount'] ?? 0)],
            ['Failed amount', (float) ($summary['failed_amount'] ?? 0)],
        ];
    }

    private function worksheet(array $rows)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        $xml .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';

        foreach (array_values($rows) as $rowIndex => $row) {
            $xml .= '<row r="' . ($rowIndex + 1) . '">';
            foreach (array_values($row) as $colIndex => $value) {
                $cell = $this->cellName($colIndex, $rowIndex + 1);
                if (is_int($value) || is_float($value)) {
                    $xml .= '<c r="' . $cell . '" t="n"><v>' . $value . '</v></c>';
                } else {
                    $xml .= '<c r="' . $cell . '" t="inlineStr"><is><t>' . $this->xml($value) . '</t></is></c>';
                }
            }
            $xml .= '</row>';
        }

        return $xml . '</sheetData></worksheet>';
    }

    private function workbook(array $sheetNames)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        $xml .= '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>';

        foreach ($sheetNames as $index => $name) {
            $sheetId = $index + 1;
            $xml .= '<sheet name="' . $this->xml($name) . '" sheetId="' . $sheetId . '" r:id="rId' . $sheetId . '"/>';
        }

        return $xml . '</sheets></workbook>';
    }

    private function contentTypes($sheetCount)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        $xml .= '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
        $xml .= '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>';
        $xml .= '<Default Extension="xml" ContentType="application/xml"/>';
        $xml .= '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
        $xml .= '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';

        for ($index = 1; $index <= $sheetCount; $index++) {
            $xml .= '<Override PartName="/xl/worksheets/sheet' . $index . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return $xml . '</Types>';
    }

    private function rootRels()
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    }

    private function workbookRels($sheetCount)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';

        for ($index = 1; $index <= $sheetCount; $index++) {
            $xml .= '<Relationship Id="rId' . $index . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $index . '.xml"/>';
        }

        $xml .= '<Relationship Id="rId' . ($sheetCount + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';

        return $xml . '</Relationships>';
    }

    private function styles()
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf/></cellXfs></styleSheet>';
    }

    private function cellName($colIndex, $row)
    {
        $name = '';
        $col = $colIndex + 1;
        while ($col > 0) {
            $mod = ($col - 1) % 26;
            $name = chr(65 + $mod) . $name;
            $col = (int) floor(($col - $mod) / 26);
        }

        return $name . $row;
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
