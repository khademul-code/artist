<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompanyInformationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'image'                 => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
            'company_name'          => 'required|string|max:255',
            'company_type'          => 'required|string',
            'company_address'       => 'nullable|string',
            'company_phone'         => 'nullable|string|max:255',
            'year_of_est'           => 'nullable|string|max:255',
            'company_bio'           => 'nullable|string',
            'business_category'     => 'nullable|array',
            'sendcontact_link'      => 'nullable|string',
            'zip_code'              => 'nullable|string|max:255',
            'city'                  => 'nullable|string',
        ];
    }
}
