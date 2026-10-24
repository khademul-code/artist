<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GemRequest extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'request_number',
        'slug',
        'user_id',
        'gem_type_id',
        'gem_shape_id',
        'gem_color_id',
        'reference_image',
        'size',
        'quantity',
        'request_details',
        'status',
        'withdrawn_at',
    ];

    protected $casts = [
        'quantity'     => 'integer',
        'withdrawn_at' => 'datetime',
    ];

    protected $appends = [
        'reference_image_url',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = self::generateRequestNumber();
            }

            if (empty($model->slug)) {
                $typeName = $model->gemType?->name;
                if (!$typeName && $model->gem_type_id) {
                    $typeName = GemType::find($model->gem_type_id)?->name;
                }
                $model->slug = self::generateSlug($typeName ?? 'gem', $model->request_number);
            }
        });
    }

    /**
     * Generate unique sequential request number.
     * Starts at 1000001 (7 digits) and naturally expands if it reaches 9999999.
     */
    public static function generateRequestNumber(): string
    {
        $last = static::max('id') ?? 0;
        $next = 1000000 + $last + 1;

        while (static::where('request_number', (string) $next)->exists()) {
            $next++;
        }

        return (string) $next;
    }

    /**
     * Generate a unique slug: {type-name}-{request-number} (e.g. pearl-1000001)
     */
    public static function generateSlug(string $typeName, string $requestNumber): string
    {
        $base = Str::slug($typeName . '-' . $requestNumber);
        $slug = $base;
        $counter = 1;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * Full URL for reference image
     */
    public function getReferenceImageUrlAttribute(): ?string
    {
        if ($this->reference_image) {
            return asset($this->reference_image);
        }

        return null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gemType(): BelongsTo
    {
        return $this->belongsTo(GemType::class, 'gem_type_id');
    }

    public function gemShape(): BelongsTo
    {
        return $this->belongsTo(GemShape::class, 'gem_shape_id');
    }

    public function gemColor(): BelongsTo
    {
        return $this->belongsTo(GemColor::class, 'gem_color_id');
    }

    public function proposals()
    {
        return $this->hasMany(GemRequestProposal::class, 'gem_request_id');
    }

    public function scopeForBuyer($query, int $buyerId)
    {
        return $query->where('user_id', $buyerId);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
