<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GemRequestProposal extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'gem_request_id',
        'user_id',
        'price',
        'description',
        'images',
        'status',
    ];

    protected $casts = [
        'price'  => 'float',
        'images' => 'array',
    ];

    protected $appends = [
        'image_urls',
    ];

    /**
     * Get array of full URLs for all uploaded proposal images.
     */
    public function getImageUrlsAttribute(): array
    {
        if (empty($this->images) || !is_array($this->images)) {
            return [];
        }

        return array_values(array_map(function ($imagePath) {
            return asset($imagePath);
        }, $this->images));
    }

    /**
     * The target gem request this proposal was submitted for.
     */
    public function gemRequest(): BelongsTo
    {
        return $this->belongsTo(GemRequest::class, 'gem_request_id');
    }

    /**
     * The supplier / seller who submitted the proposal.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for supplier relation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
