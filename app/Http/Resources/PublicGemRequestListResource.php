<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicGemRequestListResource extends JsonResource
{
    /**
     * Transform the resource into an array for public listing.
     * Includes: optional image, buyer name, user name, description, how long ago the post.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                     => (int) ($this->request_number ?? $this->id),
            'slug'                   => $this->slug,
            'request_details'        => $this->request_details,
            'image'                  => $this->reference_image_url,
            'time_ago'               => $this->created_at?->diffForHumans(),
            'status'                 => $this->status,

            'gem_type'               => $this->whenLoaded('gemType', function () {
                return [
                    'id'   => $this->gemType->id,
                    'name' => $this->gemType->name,
                ];
            }, $this->gemType ? [
                'id'   => $this->gemType->id,
                'name' => $this->gemType->name,
            ] : null),

            'buyer'                  => $this->whenLoaded('user', function () {
                return [
                    'id'            => $this->user->id,
                    'name'          => $this->user->name,
                    'avatar'        => $this->user->avatar_url ?? null,
                ];
            }, $this->user ? [
                'id'            => $this->user->id,
                'name'          => $this->user->name,
                'avatar'        => $this->user->avatar_url ?? null,
            ] : null),

            'created_at'             => $this->created_at?->toIso8601String(),
        ];
    }
}
