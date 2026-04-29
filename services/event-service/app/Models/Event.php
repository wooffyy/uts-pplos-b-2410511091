<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title', 'description', 'location',
        'event_date', 'organizer_id', 'status', 
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'status' => 'string'
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
