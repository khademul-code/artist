<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Decode product_information if sent as a JSON string in multipart/form-data
        if ($this->has('product_information') && is_string($this->product_information)) {
            $decoded = json_decode($this->product_information, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['product_information' => $decoded]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'                  => 'required|string|max:255',
            'product_type'          => 'nullable|string|max:255',
            'product_category_id'   => 'nullable|exists:product_categories,id',
            'base_price'            => 'required|numeric|min:0',
            'offer_price'           => 'nullable|numeric|min:0',
            'quantity'              => 'required|integer|min:1',
            'deal_duration'         => 'nullable|string|max:100',
            'description'           => 'nullable|string',
            'product_information'   => 'nullable|array',
            'product_information.*.topic'       => 'nullable|string|max:255',
            'product_information.*.information' => 'nullable|string|max:500',
            'images'                => 'nullable|array',
            'images.*'              => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
        ];
    }
}
