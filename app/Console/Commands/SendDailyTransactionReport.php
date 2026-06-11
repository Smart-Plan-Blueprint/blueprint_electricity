<?php

namespace App\Console\Commands;

use App\Mail\DailyTransactionReportMail;
use App\Models\ReportSetting;
use App\Services\TransactionReportService;
use App\Services\XlsxReportBuilder;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDailyTransactionReport extends Command
{
    protected $signature = 'reports:send-daily-transactions {--date= : Report date in YYYY-MM-DD format} {--force : Send even when the daily email setting is disabled}';
    protected $description = 'Send the Smart Plan Blueprint Electricity email.';

    public function handle(TransactionReportService $reports, XlsxReportBuilder $workbooks)
    {
        $setting = ReportSetting::current();
        $recipients = $setting->normalizedRecipients();

        if (!$setting->enabled && !$this->option('force')) {
            $this->info('Daily transaction report email is disabled.');
            return 0;
        }

        if (!count($recipients)) {
            $this->warn('No report recipients are configured.');
            return 0;
        }

        $timezone = $setting->timezone ?: 'Africa/Gaborone';
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'), $timezone)
            : Carbon::now($timezone)->subDay();

        $report = $reports->daily($date, $timezone);
        $workbook = $workbooks->build($report);
        $fileName = $workbooks->fileName($report['from'], $report['to']);

        $airtimeSummary = $report['airtime_summary'] ?? null;

        $combinedSummary = [
            'total_count' => ($report['summary']['total_count'] ?? 0) + ($airtimeSummary['total_count'] ?? 0),
            'success_count' => ($report['summary']['success_count'] ?? 0) + ($airtimeSummary['success_count'] ?? 0),
            'failed_count' => ($report['summary']['failed_count'] ?? 0) + ($airtimeSummary['failed_count'] ?? 0),
            'pending_count' => ($report['summary']['pending_count'] ?? 0) + ($airtimeSummary['pending_count'] ?? 0),
            'success_rate' => 0,
            'total_amount' => ($report['summary']['total_amount'] ?? 0) + ($airtimeSummary['total_amount'] ?? 0),
            'failed_amount' => $report['summary']['failed_amount'] ?? 0,
        ];

        $combinedTotal = $combinedSummary['total_count'];
        $combinedSuccess = $combinedSummary['success_count'];
        $combinedSummary['success_rate'] = $combinedTotal ? (int) round(($combinedSuccess / $combinedTotal) * 100) : 0;

        Mail::to($recipients)->send(new DailyTransactionReportMail($report, $workbook, $fileName, $combinedSummary));

        Log::info('Airtime rows count', ['count' => count($report['airtime_rows'] ?? [])]);
        Log::info('Daily transaction report email sent.', [
            'recipients' => $recipients,
            'date' => $report['from']->toDateString(),
            'file_name' => $fileName,
            'summary' => $report['summary'],
        ]);

        $this->info('Daily transaction report sent to ' . count($recipients) . ' recipient(s).');

        return 0;
    }
}
