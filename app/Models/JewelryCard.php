<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Searchable;

class JewelryCard extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'company_information_id',
        'image',
        'mini_site_url',
        'company_type',
        'company_name',
        'business_category',
        'trade_show',
        'booth_number',
        'company_bio',
        'email',
        'phone',
        'address',
        'zip_code',
        'city',
        'status',
    ];

    protected $casts = [
        'business_category' => 'array',
        'trade_show' => 'array',
    ];

    protected $appends = ['full_image_path'];

    public function getFullImagePathAttribute()
    {
        if ($this->image) {
            return asset($this->image);
        }

        return null;
    }

    public function companyInformation()
    {
        return $this->belongsTo(CompanyInformation::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
