<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('vehicle_type');
            $table->string('nid_number')->nullable()->after('date_of_birth');
            $table->string('nid_document')->nullable()->after('nid_number');
            $table->string('emergency_contact_name')->nullable()->after('nid_document');
            $table->string('emergency_contact_number')->nullable()->after('emergency_contact_name');
            $table->string('license_number')->nullable()->after('emergency_contact_number');
            $table->string('license_document')->nullable()->after('license_number');
            $table->string('vehicle_registration')->nullable()->after('license_document');
            $table->string('vehicle_description')->nullable()->after('vehicle_registration');
            $table->string('delivery_area')->nullable()->after('city');
            $table->string('address')->nullable()->after('delivery_area');
        });
    }

    public function down(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'nid_number',
                'nid_document',
                'emergency_contact_name',
                'emergency_contact_number',
                'license_number',
                'license_document',
                'vehicle_registration',
                'vehicle_description',
                'delivery_area',
                'address',
            ]);
        });
    }
};