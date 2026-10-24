<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    protected $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message->load(['sender' , 'attachments']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('conversation.' . $this->message->conversation_id)
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'text' => $this->message->text,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender->name,
            'attachments' => $this->message->attachments->map(function ($file) {
                return [
                    'id' => $file->id,
                    'url' => $file->url,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                ];
            }),
            'created_at' => $this->message->created_at->toDateTimeString(),
        ];
    }
}
