<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = ['receiver_id', 'sender_id', 'text', 'conversation_id', 'is_read', 'metadata'];

    protected $appends = ['time'];

    public function getTimeAttribute()
    {
        return $this->created_at->diffForHumans();
    }

    protected  $casts = [
        'created_at' => 'datetime',
        'sender_id'   => 'integer' ,
        'receiver_id' => 'integer',
        'text'        => 'string',
        'metadata' => 'array',
        'is_read' => 'boolean',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class );
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }
}
