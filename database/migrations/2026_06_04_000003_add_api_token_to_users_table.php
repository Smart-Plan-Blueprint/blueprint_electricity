<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddApiTokenToUsersTable extends Migration
{
    public function up()
    {
        if (Schema::hasColumn('users', 'api_token')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('api_token', 80)->nullable()->unique()->after('password');
        });
    }

    public function down()
    {
        if (! Schema::hasColumn('users', 'api_token')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('api_token');
        });
    }
}
