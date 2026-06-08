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
    protected $description = 'Send the Smart Plan Blueprint daily transaction report email.';

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

        Mail::to($recipients)->send(new DailyTransactionReportMail($report, $workbook, $fileName));

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
