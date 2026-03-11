<?php

namespace App\Http\Requests\Admin\Users;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('edit users') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = (int) optional($this->route('user'))->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$userId],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'email_verified' => ['sometimes', 'boolean'],
            'ban.reason' => ['sometimes', 'required_with:ban.until', 'string', 'max:2000'],
            'ban.until' => ['sometimes', 'nullable', 'date'],
            'unban' => ['sometimes', 'boolean'],
        ];
    }
}
