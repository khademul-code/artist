<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GemColorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'sort_order'      => (int) $this->sort_order,
            'name'            => $this->name,
            'image'           => $this->image,
            'full_image_path' => $this->full_image_path,
        ];
    }
}
