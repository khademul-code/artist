<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GemRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                     => (int) ($this->request_number ?? $this->id),
            'slug'                   => $this->slug,
            'size'                   => $this->size,
            'quantity'               => (int) $this->quantity,
            'request_details'        => $this->request_details,
            'status'                 => $this->status,
            'reference_image'        => $this->reference_image_url,

            // Relations
            'gem_type'               => $this->whenLoaded('gemType', function () {
                return [
                    'id'   => $this->gemType->id,
                    'name' => $this->gemType->name,
                ];
            }, $this->gemType ? [
                'id'   => $this->gemType->id,
                'name' => $this->gemType->name,
            ] : null),

            'gem_shape'              => $this->whenLoaded('gemShape', function () {
                return [
                    'id'              => $this->gemShape->id,
                    'name'            => $this->gemShape->name,
                    'image'           => $this->gemShape->image,
                    'full_image_path' => $this->gemShape->full_image_path,
                ];
            }, $this->gemShape ? [
                'id'              => $this->gemShape->id,
                'name'            => $this->gemShape->name,
                'image'           => $this->gemShape->image,
                'full_image_path' => $this->gemShape->full_image_path,
            ] : null),

            'gem_color'              => $this->whenLoaded('gemColor', function () {
                return [
                    'id'              => $this->gemColor->id,
                    'name'            => $this->gemColor->name,
                    'image'           => $this->gemColor->image,
                    'full_image_path' => $this->gemColor->full_image_path,
                ];
            }, $this->gemColor ? [
                'id'              => $this->gemColor->id,
                'name'            => $this->gemColor->name,
                'image'           => $this->gemColor->image,
                'full_image_path' => $this->gemColor->full_image_path,
            ] : null),

            'buyer'                  => $this->whenLoaded('user', function () {
                return [
                    'id'     => $this->user->id,
                    'name'   => $this->user->name,
                    'email'  => $this->user->email,
                    'avatar' => $this->user->avatar_url ?? null,
                ];
            }),

            'withdrawn_at'           => $this->withdrawn_at?->toIso8601String(),
            'created_at'             => $this->created_at?->toIso8601String(),
            'updated_at'             => $this->updated_at?->toIso8601String(),
        ];
    }
}
