<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_information', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('image')->nullable();
            $table->string('company_name')->nullable();
            $table->string('year_of_est')->nullable();
            $table->text('company_bio')->nullable();
            $table->string('company_type')->nullable();
            $table->string('company_phone')->nullable();
            $table->text('company_address')->nullable();
            $table->json('business_category')->nullable();
            $table->string('sendcontact_link')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('city')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, requires_changes
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_information');
    }
};
