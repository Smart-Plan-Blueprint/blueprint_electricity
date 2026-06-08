<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReportSettingsTable extends Migration
{
    public function up()
    {
        Schema::create('report_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(false);
            $table->json('recipients')->nullable();
            $table->string('timezone')->default('Africa/Gaborone');
            $table->string('send_time', 5)->default('02:00');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('report_settings');
    }
}
