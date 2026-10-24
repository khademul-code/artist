<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGemRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'buyer';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'gem_type_id'     => 'sometimes|required|exists:gem_types,id',
            'gem_shape_id'    => 'nullable|exists:gem_shapes,id',
            'gem_color_id'    => 'nullable|exists:gem_colors,id',
            'reference_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'size'            => 'nullable|string|max:100',
            'quantity'        => 'sometimes|nullable|integer|min:1',
            'request_details' => 'nullable|string|max:3000',
        ];
    }

    /**
     * Custom error messages
     */
    public function messages(): array
    {
        return [
            'gem_type_id.required'  => 'Please select a gem type.',
            'gem_type_id.exists'    => 'The selected gem type is invalid.',
            'gem_shape_id.exists'   => 'The selected gem shape is invalid.',
            'gem_color_id.exists'   => 'The selected gem color is invalid.',
            'reference_image.image' => 'The reference image must be a valid image file.',
            'reference_image.max'   => 'The reference image file size may not exceed 10MB.',
            'quantity.min'          => 'Quantity must be at least 1.',
        ];
    }
}
