<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('reset_otp')->nullable()->after('setup_otp_expires_at');
            $table->timestamp('reset_otp_expires_at')->nullable()->after('reset_otp');
            $table->unsignedTinyInteger('reset_otp_attempts')->default(0)->after('reset_otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['reset_otp', 'reset_otp_expires_at', 'reset_otp_attempts']);
        });
    }
};
