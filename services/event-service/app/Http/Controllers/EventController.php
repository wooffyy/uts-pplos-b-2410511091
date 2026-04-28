<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;

class EventController extends Controller
{
    protected $format = 'json';

    public function index(Request $request) {
        $perPage = min($request->get('per_page', 10), 50);

        $events = Event::query()
            ->when($request->location, function($q) use ($request) {
                $q->where('location', 'like', '%' . $request->location . '%');   
            })
            ->when($request->event_date, function($q) use ($request) {
                $q->where('event_date', 'like', '%' . $request->event_date);
            })
            ->when($request->status, function($q) use ($request) {
                $q->where('status', 'like', '%' . $request->status . '%');
            })
            ->paginate($perPage);
        
        return response()->json($events);
    }

    public function store(StoreEventRequest $request) {
        $org_id = $request->header('X-User-Id');
        if (!$org_id) {
            return response()->json([ 'message' => 'X-User-Id is required' ], 404);
        }

        $data = $request->validated();
        $data['organizer_id'] = $org_id;

        $event = Event::create($data);

        return response()->json($event, 201);
    }

    public function show(string $id) {
        $event = Event::with('tickets')->find($id);

        if (!$event) {
            return response()->json([ 'message' => 'Event not found' ], 404);
        }

        return response()->json($event);
    }

    public function update(UpdateEventRequest $request, string $id){
        $org_id = $request->header('X-User-Id');
        $event = Event::find($id);

        if (!$event) {
            return response()->json([ 'message' => 'Event not found' ], 404);
        }

        if ($event->organizer_id !== $org_id){
            return response()->json([ 'message' => 'Forbidden', 403 ]);
        }

        $event->update($request->validated());

        return response()->json([ 'message' => 'Event updated', 'data' => $event ]);
    }

    public function destroy(Request $request, $id) {
        $org_id = $request->header('X-User-Id');
        $event = Event::find($id);

        if (!$event) {
            return response()->json([ 'message' => 'Event not found' ], 404);
        }

        if ($event->organizer_id !== $org_id){
            return response()->json([ 'message' => 'Forbidden', 403 ]);
        }

        $event->destroy();
        
        return response()->json([ 'message' => 'Event deleted', 204 ]);
    }
}
