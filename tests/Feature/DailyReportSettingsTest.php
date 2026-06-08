<?php

namespace Tests\Feature;

use App\Mail\DailyTransactionReportMail;
use App\Models\ElectricityTransaction;
use App\Models\ReportSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class DailyReportSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_report_settings()
    {
        $token = $this->adminToken();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/report-settings', [
                'enabled' => true,
                'recipients' => ['Owner@Example.com', 'owner@example.com', 'ops@example.com'],
                'timezone' => 'Africa/Gaborone',
                'send_time' => '02:00',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.recipients', ['owner@example.com', 'ops@example.com']);
    }

    public function test_invalid_recipient_is_rejected()
    {
        $token = $this->adminToken();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/report-settings', [
                'enabled' => true,
                'recipients' => ['not-an-email'],
            ])
            ->assertStatus(422);
    }

    public function test_send_test_emails_the_excel_report()
    {
        Mail::fake();
        $token = $this->adminToken();
        ReportSetting::current()->update([
            'enabled' => true,
            'recipients' => ['ops@example.com'],
        ]);
        ElectricityTransaction::create([
            'transaction_id' => 'tx-100',
            'amount' => 55.25,
            'meter_number' => '14020896826',
            'status' => 'SUCCESS',
            'created_at' => now('Africa/Gaborone')->subDay()->setTime(10, 0),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/report-settings/send-test')
            ->assertOk()
            ->assertJsonPath('data.summary.total_count', 1);

        Mail::assertSent(DailyTransactionReportMail::class, function ($mail) {
            return $mail->hasTo('ops@example.com')
                && Str::endsWith($mail->fileName, '.xlsx');
        });
    }

    public function test_disabled_scheduled_report_does_not_send()
    {
        Mail::fake();
        ReportSetting::current()->update([
            'enabled' => false,
            'recipients' => ['ops@example.com'],
        ]);

        $this->artisan('reports:send-daily-transactions')
            ->expectsOutput('Daily transaction report email is disabled.')
            ->assertExitCode(0);

        Mail::assertNothingSent();
    }

    private function adminToken()
    {
        $token = Str::random(40);
        $user = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        $user->forceFill(['api_token' => $token])->save();

        return $token;
    }
}
