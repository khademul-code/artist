<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JewelryDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'company_name'      => $this->company_name,
            'company_bio'       => $this->company_bio,
            'business_category' => $this->business_category,
            'email'             => $this->email,
            'phone'             => $this->phone,
            'address'           => $this->address,
            'city'              => $this->city,
            'zip_code'          => $this->zip_code,
            'sendcontact_link'  => $this->mini_site_url,
            'full_image_path'   => $this->full_image_path,
            'average_rating'    => $this->reviews_avg_rating ?? 0,
            'review_count'      => $this->reviews_count ?? 0,
        ];
    }
}
