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
        Schema::table('products', function (Blueprint $table) {
            $table->string('status')->default('active')->change();
            $table->string('payment_status')->default('free')->after('status');
            $table->decimal('payment_fee', 8, 2)->default(0.00)->after('payment_status');
            $table->string('stripe_session_id')->nullable()->index()->after('payment_fee');
            $table->string('stripe_payment_intent_id')->nullable()->index()->after('stripe_session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['stripe_session_id']);
            $table->dropIndex(['stripe_payment_intent_id']);
            $table->dropColumn([
                'payment_status',
                'payment_fee',
                'stripe_session_id',
                'stripe_payment_intent_id',
            ]);
        });
    }
};
