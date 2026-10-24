<?php

namespace App\Http\Controllers\API\Message;

use Carbon\Carbon;
use App\Models\Message;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function totalunread(Request $request)
    {
        $userId = auth()->id();

        $totalUnread = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'status' => true,
            'code' => 200,
            'data' => $totalUnread,
        ], 200);
    }

    public function index(Request $request)
    {
        $userId = auth()->id();

        $search = $request->query('search');

        $conversations = Conversation::with([
            'userOne',
            'userTwo',
            'messages' => fn($q) => $q->latest()->limit(1)
        ])
            ->withCount([
                'unreadMessages as user_unread' => fn($q) => $q->where('receiver_id', $userId)
            ])
            ->where(function ($q) use ($userId) {
                $q->where('user_one_id', $userId)
                    ->orWhere('user_two_id', $userId);
            })
            ->when($search, function ($q) use ($search, $userId) {
                $q->where(function ($q) use ($search, $userId) {

                    // when I am user_one → search user_two
                    $q->where(function ($q) use ($search, $userId) {
                        $q->where('user_one_id', $userId)
                            ->whereHas('userTwo', function ($q) use ($search) {
                                $q->where('name', 'LIKE', "%{$search}%");
                            });
                    })

                        // when I am user_two → search user_one
                        ->orWhere(function ($q) use ($search, $userId) {
                            $q->where('user_two_id', $userId)
                                ->whereHas('userOne', function ($q) use ($search) {
                                    $q->where('name', 'LIKE', "%{$search}%");
                                });
                        });
                });
            })
            ->withMax('messages', 'created_at')
            ->orderByDesc('messages_max_created_at')
            ->paginate(10);

        // Transform response
        $conversations->getCollection()->transform(function ($conversation) use ($userId) {

            $otherUser = $conversation->user_one_id == $userId
                ? $conversation->userTwo
                : $conversation->userOne;

            return [
                'conversation_id' => $conversation->id,
                'user'            => $otherUser,
                'is_online'       => $otherUser ? (bool)$otherUser->is_online : false,
                'last_message'    => $conversation->messages->first(),
                'unread_count'    => $conversation->user_unread,
                'last_message_at' => $conversation->messages_max_created_at ? Carbon::parse($conversation->messages_max_created_at)->diffForHumans() : null,
            ];
        });

        return response()->json([
            'status' => true,
            'code' => 200,
            'data' => $conversations,
        ]);
    }


    // Load all messages of a conversation
    public function show(Conversation $conversation)
    {
        $userId = auth()->id();
        // ensure user is part of this conversation
        if (!in_array($userId, [$conversation->user_one_id, $conversation->user_two_id])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $receiver = $conversation->user_one_id == $userId
            ? $conversation->userTwo
            : $conversation->userOne;

        $conversation->messages()
            ->where('receiver_id', $userId)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);

        $messages = $conversation->messages()->with(['sender', 'attachments'])->latest()->paginate(20);

        return response()->json([
            'status' => true,
            'code' => 200,
            'data' => $messages,
        ], 200);
    }


    public function createConversation(Request $request)
    {
        $data = $request->validate([
            'receiver_id' => 'required|exists:users,id',
        ]);

        $senderId = auth()->id();
        $receiverId = $data['receiver_id'];

        if ($senderId == $receiverId) {
            return response()->json(['status' => false, 'message' => 'Cannot create conversation with yourself.'], 422);
        }

        $conversation = Conversation::where(function ($q) use ($senderId, $receiverId) {
            $q->where('user_one_id', $senderId)
                ->where('user_two_id', $receiverId);
        })
            ->orWhere(function ($q) use ($senderId, $receiverId) {
                $q->where('user_one_id', $receiverId)
                    ->where('user_two_id', $senderId);
            })
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'user_one_id' => $senderId,
                'user_two_id' => $receiverId,
            ]);
        }



        return response()->json([
            'status'        => true,
            'code'          => 200,
            'data'          => $conversation,
        ]);
    }


    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'text'            => 'required_without:attachments|nullable|string|max:1000',
            'attachments'     => 'required_without:text|nullable|array|max:10',
            'attachments.*'   => 'file|mimes:jpg,jpeg,png,gif,pdf,doc,docx,rar,zip|max:102400',
            'metadata'        => 'nullable|array|max:10',
            'metadata.*'      => 'nullable|string|max:10000',
        ]);

        $senderId = auth()->id();

        $conversation = Conversation::findOrFail($data['conversation_id']);

        // Prevent IDOR: Ensure sender is an authorized participant of this conversation
        if (!in_array($senderId, [$conversation->user_one_id, $conversation->user_two_id])) {
            return response()->json([
                'status'  => false,
                'message' => 'Unauthorized access to this conversation.',
            ], 403);
        }

        $receiverId = $conversation->user_one_id == $senderId
            ? $conversation->user_two_id
            : $conversation->user_one_id;

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $senderId,
            'receiver_id'     => $receiverId,
            'text'            => $data['text'] ?? null,
            'metadata'        => $data['metadata'] ? json_encode($data['metadata']) : null,
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {

                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

                $file->move(
                    public_path('uploads/chat-attachments'),
                    $filename
                );

                $message->attachments()->create([
                    'path'          => 'uploads/chat-attachments/' . $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type'     => $file->getClientMimeType(),
                ]);
            }
        }

        $message->load('attachments');

        // broadcast(new MessageSent($message))->toOthers();

        // Create notification for receiver

        return response()->json([
            'status' => true,
            'code' => 201,
            'data' => $message,
        ], 201);
    }
}
