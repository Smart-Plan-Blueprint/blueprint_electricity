<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateElectricityTransactionsTable extends Migration
{
    public function up()
    {
        Schema::create('electricity_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_log_id')->nullable()->unique();
            $table->string('transaction_id')->nullable()->index();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('meter_number')->nullable()->index();
            $table->string('account_number')->nullable()->index();
            $table->string('status', 32)->default('PENDING')->index();
            $table->text('message')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('receipt_no')->nullable()->index();
            $table->string('units')->nullable();
            $table->string('endpoint')->nullable();
            $table->ipAddress('request_ip')->nullable();
            $table->timestamps();

            $table->foreign('transaction_log_id')
                ->references('id')
                ->on('electricity_transaction_logs')
                ->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('electricity_transactions');
    }
}
