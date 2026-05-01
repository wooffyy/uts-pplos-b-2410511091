<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Ticket;
use App\Models\Event;
use App\Http\Requests\StoreTicketRequest;


class TicketController extends Controller
{
    protected $format = 'json';
    
    public function index(Request $request, $eventId) {
        $tickets = Ticket::where('event_id', $eventId)->get();

        return response()->json($tickets);
    }

    public function reduceQuota(Request $request, $categoryId) {
        $quantity = (int) $request->input('quantity');

        if ($quantity <= 0) {
            return response()->json(['message' => 'Invalid quantity'], 400);
        }

        DB::beginTransaction();
        try {
            $ticket = Ticket::lockforupdate()->find($categoryId);

            if (!$ticket) {
                DB::rollBack();
                return response()->json(['message' => 'Ticket not found'], 404);
            }

            if ($ticket->quota_remaining < $quantity) {
                DB::rollBack();
                return response()->json(['message' => 'Not enough quota'], 409);
            }

            $ticket->quota_remaining -= $quantity;
            $ticket->save();

            DB::commit();
            return response()->json([ 'message' => 'Quota reduced', 'data' => $ticket ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }

    public function show($id) {
        $ticket = Ticket::find($id);
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }
        return response()->json($ticket);
    }

    public function store(StoreTicketRequest $request, $eventId) {
        $event = Event::find($eventId);
        if (!$event) {
            return response()->json(['message' => 'Event not found'], 404);
        }
    
        $org_id = $request->attributes->get('user_id');
        if ($event->organizer_id !== $org_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
    
        $ticket = Ticket::create([
            'event_id' => $eventId,
            'name' => $request->name,
            'price' => $request->price,
            'quota' => $request->quota,
            'quota_remaining' => $request->quota,
        ]);
    
        return response()->json($ticket, 201);
    }
}
