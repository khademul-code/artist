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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('product_category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('product_type')->nullable();
            $table->decimal('base_price', 12, 2)->default(0.00);
            $table->decimal('offer_price', 12, 2)->default(0.00);
            $table->integer('quantity')->default(1);
            $table->string('deal_duration')->nullable(); // e.g. 24 Hours, 3 Days, 1 Weeks, 1 month, Until Sold
            $table->timestamp('expires_at')->nullable();
            $table->longText('description')->nullable();
            $table->json('product_information')->nullable(); // [{"topic": "Shape", "information": "Round"}]
            $table->json('images')->nullable();
            $table->integer('view_count')->default(0);
            $table->enum('status', ['active', 'inactive', 'sold', 'expired'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
