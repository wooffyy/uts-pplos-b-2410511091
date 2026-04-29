<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Http\Requests\StoreTicketRequest;

class TicketController extends Controller
{
    protected $format = 'json';
    
    public function index(Request $request, $eventId) {
        $tickets = Ticket::where('event_id', $eventId)->get();

        if ($tickets->isEmpty()) {
            return response()->json(['message' => 'No tickets found'], 404);
        }

        return response()->json($tickets);
    }

    public function reduceQuota(Request $request, $categoryId) {
        $quantity = (int) $request->input('quantity');

        if ($quantity <= 0) {
            return response()->json(['message' => 'Invalid quantity'], 400);
        }

        $tickets = Ticket::find($categoryId);
        if (!$tickets) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if($tickets->quota_remaining < $quantity){
            return response()->json(['message' => 'Not enough quota'], 409);
        }

        $tickets->quota_remaining -= $quantity;
        $tickets->save();

        return response()->json([ 'message' => 'Quota reduced', 'data' => $tickets ]);
    }
}
