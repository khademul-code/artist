<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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

        // Decode deleted_images if sent as a JSON string
        if ($this->has('deleted_images') && is_string($this->deleted_images)) {
            $decoded = json_decode($this->deleted_images, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['deleted_images' => $decoded]);
            }
        }

        // Decode existing_images if sent as a JSON string
        if ($this->has('existing_images') && is_string($this->existing_images)) {
            $decoded = json_decode($this->existing_images, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['existing_images' => $decoded]);
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
            'name'                              => 'sometimes|required|string|max:255',
            'product_type'                      => 'nullable|string|max:255',
            'product_category_id'               => 'nullable|exists:product_categories,id',
            'base_price'                        => 'sometimes|required|numeric|min:0',
            'offer_price'                       => 'nullable|numeric|min:0',
            'quantity'                          => 'sometimes|required|integer|min:1',
            'deal_duration'                     => 'nullable|string|max:100',
            'description'                       => 'nullable|string',
            'status'                            => 'nullable|string|in:active,inactive,expired,sold',

            // Product information
            'product_information'               => 'nullable|array',
            'product_information.*.topic'       => 'nullable|string|max:255',
            'product_information.*.information' => 'nullable|string|max:500',

            // New image uploads
            'images'                            => 'sometimes|array',
            'images.*'                          => 'required|file|image|mimes:jpeg,jpg,png,webp|max:10240',

            // Backward compatibility: single image upload
            'image'                             => 'sometimes|file|image|mimes:jpeg,jpg,png,webp|max:10240',

            // Remove selected existing images
            'remove_images'                     => 'sometimes|array',
            'remove_images.*'                   => 'required|string|max:2048',
        ];
    }
}
