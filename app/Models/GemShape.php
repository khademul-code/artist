<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Searchable;

class GemShape extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'name',
        'image',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected $appends = ['full_image_path'];

    public function getFullImagePathAttribute(): ?string
    {
        if ($this->image) {
            return asset($this->image);
        }

        return null;
    }
}
