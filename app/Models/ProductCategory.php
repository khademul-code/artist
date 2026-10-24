<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasFactory;
    use Searchable;

    protected $fillable = [
        'name',
        'status',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
