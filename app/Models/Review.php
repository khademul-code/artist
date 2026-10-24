<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Searchable;

class Review extends Model
{
    use Searchable;

    protected $fillable = [
        'jewelry_card_id',
        'user_id',
        'rating',
        'comment',
    ];

    public function jewelryCard()
    {
        return $this->belongsTo(JewelryCard::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
