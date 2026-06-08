<?php

namespace App\Http\Controllers;

use App\Mail\DailyTransactionReportMail;
use App\Models\ReportSetting;
use App\Services\TransactionReportService;
use App\Services\XlsxReportBuilder;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class ReportSettingController extends Controller
{
    public function show()
    {
        return response()->json([
            'results' => 'SUCCESS',
            'data' => $this->payload(ReportSetting::current()),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'recipients' => ['array'],
            'recipients.*' => ['email'],
            'timezone' => ['sometimes', Rule::in(['Africa/Gaborone'])],
            'send_time' => ['sometimes', Rule::in(['02:00'])],
        ]);

        $setting = ReportSetting::current();
        $setting->fill([
            'enabled' => (bool) $data['enabled'],
            'recipients' => collect($data['recipients'] ?? [])->map(function ($email) {
                return strtolower(trim($email));
            })->filter()->unique()->values()->all(),
            'timezone' => $data['timezone'] ?? 'Africa/Gaborone',
            'send_time' => $data['send_time'] ?? '02:00',
        ])->save();

        Audit::record('report_settings.updated', 'Updated daily email report settings', [
            'enabled' => $setting->enabled,
            'recipient_count' => count($setting->normalizedRecipients()),
            'timezone' => $setting->timezone,
            'send_time' => $setting->send_time,
        ], ['category' => 'report']);

        return response()->json([
            'results' => 'SUCCESS',
            'data' => $this->payload($setting->fresh()),
        ]);
    }

    public function sendTest(TransactionReportService $reports, XlsxReportBuilder $workbooks)
    {
        $setting = ReportSetting::current();
        $recipients = $setting->normalizedRecipients();

        if (!count($recipients)) {
            return response()->json([
                'results' => 'FAILED',
                'message' => 'Add at least one recipient before sending a test email.',
            ], 422);
        }

        $report = $reports->daily(Carbon::now($setting->timezone)->subDay(), $setting->timezone);
        $workbook = $workbooks->build($report);
        $fileName = $workbooks->fileName($report['from'], $report['to']);

        Mail::to($recipients)->send(new DailyTransactionReportMail($report, $workbook, $fileName));

        Audit::record('report_settings.test_sent', 'Sent a daily report test email', [
            'recipient_count' => count($recipients),
            'date' => $report['from']->toDateString(),
        ], ['category' => 'report']);

        return response()->json([
            'results' => 'SUCCESS',
            'message' => 'Test report email sent.',
            'data' => [
                'recipients' => $recipients,
                'file_name' => $fileName,
                'summary' => $report['summary'],
            ],
        ]);
    }

    private function payload(ReportSetting $setting)
    {
        return [
            'enabled' => (bool) $setting->enabled,
            'recipients' => $setting->normalizedRecipients(),
            'timezone' => $setting->timezone,
            'send_time' => $setting->send_time,
        ];
    }
}
