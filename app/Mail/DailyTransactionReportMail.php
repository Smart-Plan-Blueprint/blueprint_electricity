<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DailyTransactionReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public $report;
    public $fileName;
    private $workbook;

    public function __construct(array $report, $workbook, $fileName)
    {
        $this->report = $report;
        $this->workbook = $workbook;
        $this->fileName = $fileName;
    }

    public function build()
    {
        $from = $this->report['from']->toDateString();
        $summary = $this->report['summary'];

        return $this
            ->subject('Smart Plan Blueprint daily electricity report - ' . $from)
            ->view('emails.daily_transaction_report', [
                'from'            => $this->report['from'],
                'to'              => $this->report['to'],
                'summary'         => $summary,
                'airtime_summary' => $this->report['airtime_summary'] ?? null,
            ])
            ->attachData($this->workbook, $this->fileName, [
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
    }
}
