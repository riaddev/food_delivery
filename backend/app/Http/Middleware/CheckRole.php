<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->role !== 'admin' && $user->status === 'suspended') {
            return response()->json(['message' => 'Your account has been suspended. Please contact support.'], 403);
        }

        return $next($request);
    }
}
