<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGemProposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && in_array(auth()->user()->role, ['supplier', 'admin'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'gem_request_id' => 'nullable|exists:gem_requests,id',
            'price'          => 'required|numeric|min:0.01|max:999999999.99',
            'description'    => 'nullable|string|max:5000',
            'images'         => 'nullable|array|max:10',
            'images.*'       => 'file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'image'          => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:10240',
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'price.required'   => 'The proposal price is required.',
            'price.numeric'    => 'The proposal price must be a valid number.',
            'price.min'        => 'The proposal price must be at least 0.01.',
            'images.max'       => 'You can upload a maximum of 10 proposal images.',
            'images.*.image'   => 'All uploaded proposal files must be valid images.',
            'images.*.max'     => 'Each proposal image file size cannot exceed 10MB.',
            'image.image'      => 'The proposal image must be a valid image file.',
        ];
    }
}
