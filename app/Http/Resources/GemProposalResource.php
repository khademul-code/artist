<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GemProposalResource extends JsonResource
{
    /**
     * Transform the proposal into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'gem_request_id' => $this->gem_request_id,
            'price'          => (float) $this->price,
            'description'    => $this->description,
            'images'         => $this->image_urls ?? [],
            'status'         => $this->status,
            'time_ago'       => $this->created_at?->diffForHumans(),

            'seller'         => $this->whenLoaded('supplier', function () {
                return [
                    'id'            => $this->supplier->id,
                    'name'          => $this->supplier->name,
                    'business_name' => $this->supplier->business_name,
                    'avatar'        => $this->supplier->avatar_url ?? null,
                    'email'         => $this->supplier->email,
                ];
            }, $this->supplier ? [
                'id'            => $this->supplier->id,
                'name'          => $this->supplier->name,
                'business_name' => $this->supplier->business_name,
                'avatar'        => $this->supplier->avatar_url ?? null,
                'email'         => $this->supplier->email,
            ] : null),

            'gem_request'    => $this->whenLoaded('gemRequest', function () {
                return [
                    'id'              => (int) ($this->gemRequest->request_number ?? $this->gemRequest->id),
                    'request_number'  => (string) $this->gemRequest->request_number,
                    'slug'            => $this->gemRequest->slug,
                    'request_details' => $this->gemRequest->request_details,
                    'size'            => $this->gemRequest->size,
                    'quantity'        => (int) $this->gemRequest->quantity,
                    'status'          => $this->gemRequest->status,
                    'image'           => $this->gemRequest->reference_image_url,
                    'gem_type'        => $this->gemRequest->gemType ? [
                        'id'   => $this->gemRequest->gemType->id,
                        'name' => $this->gemRequest->gemType->name,
                    ] : null,
                ];
            }),

            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}
