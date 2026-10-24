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
        Schema::create('jewelry_cards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_information_id')->nullable();
            $table->foreign('company_information_id')->references('id')->on('company_information')->nullOnDelete();
            $table->string('image');
            $table->string('mini_site_url')->nullable();
            $table->string('company_name')->nullable();
            $table->string('company_type')->nullable(); //wholeseller or retailer
            $table->json('business_category')->nullable();
            $table->json('trade_show')->nullable();
            $table->string('booth_number')->nullable();
            $table->text('company_bio')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('city')->nullable();
            $table->string('status')->default('temp_publish'); // temp_publish, publish
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jewelry_cards');
    }
};
