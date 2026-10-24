<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['user_one_id','user_two_id'];

    protected  $casts = [
        'created_at' => 'datetime',
        'user_one_id'   => 'integer' ,
        'user_two_id' => 'integer',
    ];

    public function userOne()
    {
        return $this->belongsTo(User::class , 'user_one_id');
    }

    public function userTwo()
    {
        return $this->belongsTo(User::class , 'user_two_id');
    }


    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function unreadMessages()
    {
        return $this->hasMany(Message::class)
                    ->where('status', 'unread');
    }
}
