<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'slug'                => $this->slug,
            'product_type'        => $this->product_type,
            'product_category_id' => $this->product_category_id,
            'category'            => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ] : null,
            'base_price'          => (float) $this->base_price,
            'offer_price'         => (float) $this->offer_price,
            'quantity'            => (int) $this->quantity,
            'deal_duration'       => $this->deal_duration,
            'expires_at'          => $this->expires_at?->toIso8601String(),
            'description'         => $this->description,
            'product_information' => $this->product_information ?? [],
            'images'              => $this->image_urls,
            'status'              => $this->status,
            'payment_status'      => $this->payment_status ?? 'free',
            'payment_fee'         => (float) ($this->payment_fee ?? 0.00),
            'is_free_deal'        => ($this->payment_status === 'free' || (float) $this->payment_fee == 0),
            'view_count'          => $this->view_count,
            'user_id'             => $this->user_id,
            'user'                => $this->user ? [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'created_at'          => $this->created_at?->toIso8601String(),
            'updated_at'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
