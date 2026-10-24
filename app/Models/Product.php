<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'user_id',
        'product_category_id',
        'name',
        'slug',
        'product_type',
        'base_price',
        'offer_price',
        'quantity',
        'deal_duration',
        'expires_at',
        'description',
        'product_information',
        'images',
        'status',
        'payment_status',
        'payment_fee',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'view_count',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'offer_price' => 'decimal:2',
        'payment_fee' => 'decimal:2',
        'quantity' => 'integer',
        'expires_at' => 'datetime',
        'product_information' => 'array',
        'images' => 'array',
        'view_count' => 'integer',
    ];

    protected $appends = [
        'image_urls',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function getImageUrlsAttribute(): array
    {
        if (empty($this->images) || !is_array($this->images)) {
            return [];
        }

        return array_values(array_filter(array_map(function ($image) {
            if (!$image) {
                return null;
            }
            if (filter_var($image, FILTER_VALIDATE_URL)) {
                return $image;
            }
            return asset($image);
        }, $this->images)));
    }
}
