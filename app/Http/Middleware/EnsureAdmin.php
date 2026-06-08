<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'results' => 'FAILED',
                'message' => 'Administrator access required.',
            ], 403);
        }

        return $next($request);
    }
}
