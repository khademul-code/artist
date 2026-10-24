<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompanyInformation extends Model
{
    use HasFactory;
    
    protected $fillable = [
            'user_id',
            'image',
            'company_name',
            'year_of_est',
            'company_bio',
            'company_type',
            'company_phone',
            'company_address',
            'business_category',
            'sendcontact_link',
            'zip_code',
            'city',
            'status',
            'admin_notes'
        ];
    
    protected $casts = [
        'business_category' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function jewelryCard()
    {
        return $this->hasOne(JewelryCard::class);
    }

    public function getImageAttribute($value)
    {
        if ($value) {
            return asset($value);
        }
        return asset('uploads/user/default1.png');
    }

}
