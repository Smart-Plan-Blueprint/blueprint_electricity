<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateElectricityTransactionLogsTable extends Migration
{
    public function up()
    {
        Schema::create('electricity_transaction_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('transaction_id')->nullable()->index();
            $table->string('endpoint')->nullable();
            $table->string('method', 10)->nullable();
            $table->string('meter_number')->nullable()->index();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('status', 32)->default('PENDING')->index();
            $table->text('message')->nullable();
            $table->unsignedSmallInteger('provider_status_code')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->ipAddress('request_ip')->nullable();
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->json('error_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('electricity_transaction_logs');
    }
}
