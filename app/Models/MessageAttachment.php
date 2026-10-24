<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'path',
        'original_name',
        'mime_type',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return asset($this->path);
        // return asset('storage/' . $this->path);
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
