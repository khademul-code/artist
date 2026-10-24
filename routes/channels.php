<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (!$conversation) return false;
    return (int) $user->id === (int) $conversation->user_one_id || (int) $user->id === (int) $conversation->user_two_id;
});
