<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TempUser extends Model
{
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'agree_to_terms_policy'
    ];
}
