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
        Schema::create('gem_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 20)->unique();
            $table->string('slug')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gem_type_id')->constrained('gem_types')->cascadeOnDelete();
            $table->foreignId('gem_shape_id')->nullable()->constrained('gem_shapes')->nullOnDelete();
            $table->foreignId('gem_color_id')->nullable()->constrained('gem_colors')->nullOnDelete();
            
            // Reference image (optional or for custom/other types)
            $table->string('reference_image')->nullable();
            
            $table->string('size', 100)->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->text('request_details')->nullable();
            
            // Status: pending, in_progress, completed, withdrawn
            $table->enum('status', ['pending', 'in_progress', 'completed', 'withdrawn'])->default('pending');
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gem_requests');
    }
};
