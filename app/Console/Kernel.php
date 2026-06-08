<?php

namespace App\Console;

use App\Models\ReportSetting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Schema;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        [$sendTime, $timezone] = $this->reportScheduleWindow();

        $schedule->command('reports:send-daily-transactions')
            ->dailyAt($sendTime)
            ->timezone($timezone)
            ->withoutOverlapping();
    }

    /**
     * Resolve the configured daily report send time and timezone, falling back
     * to safe defaults when the database is unavailable.
     *
     * @return array{0:string,1:string}
     */
    private function reportScheduleWindow()
    {
        $default = ['02:00', 'Africa/Gaborone'];

        try {
            if (!Schema::hasTable('report_settings')) {
                return $default;
            }

            $setting = ReportSetting::current();

            $time = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $setting->send_time)
                ? $setting->send_time
                : $default[0];

            $timezone = in_array($setting->timezone, timezone_identifiers_list(), true)
                ? $setting->timezone
                : $default[1];

            return [$time, $timezone];
        } catch (\Throwable $error) {
            return $default;
        }
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
