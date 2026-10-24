<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Searchable;

class Contact extends Model
{
    use Searchable;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'year_established',
        'company_bio',
        'jewelry_category',
    ];
}
