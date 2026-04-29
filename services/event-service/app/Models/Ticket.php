<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets';

    protected $fillable = [
        'event_id', 'name', 'price', 'quota', 'quota_remaining'
    ];

    protected $casts = [ 'price' => 'decimal:2'];      

    public function event(){
        return $this->belongsTo(Event::class);
    }
}
