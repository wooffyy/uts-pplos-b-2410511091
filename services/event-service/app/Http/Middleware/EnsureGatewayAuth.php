<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGatewayAuth
{
    public function handle(Request $request, Closure $next): Response {
        // ambil user dari gateway
        $userId = $request->header('X-User-Id');

        if (!$userId || !is_numeric($userId)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->attributes->set('user_id', (int) $userId);

        return $next($request);
    }
}
