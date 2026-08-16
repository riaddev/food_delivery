<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('setup_otp')->nullable()->after('password');
            $table->timestamp('setup_otp_expires_at')->nullable()->after('setup_otp');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['setup_otp', 'setup_otp_expires_at']);
        });
    }
};