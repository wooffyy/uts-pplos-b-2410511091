<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
           'title' => 'required|string|max:255',
           'description' => 'nullable|string',
           'location' => 'required|string|max:255',
           'event_date' => 'required|datetime|after_or_equal:today',
           'status' => 'required|in:scheduled,ongoing,cancelled,completed',
        ];
    }
}
