<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            Audit::record('auth.login_failed', 'Failed login attempt', ['email' => $data['email']], ['category' => 'auth']);

            return response()->json([
                'results' => 'FAILED',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'results' => 'FAILED',
                'message' => 'This account is disabled.',
            ], 403);
        }

        if (!$user->api_token) {
            $user->api_token = Str::random(60);
        }

        $user->last_login_at = now();
        $user->save();

        Audit::record('auth.login', 'Signed in', [], ['category' => 'auth', 'user_id' => $user->id, 'actor' => $user->email]);

        return response()->json([
            'results' => 'SUCCESS',
            'token' => $user->api_token,
            'user' => $this->publicUser($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'results' => 'SUCCESS',
            'user' => $this->publicUser($request->user()),
        ]);
    }

    public function logout(Request $request)
    {
        Audit::record('auth.logout', 'Signed out', [], ['category' => 'auth']);

        return response()->json(['results' => 'SUCCESS']);
    }

    private function publicUser(User $user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'last_login_at' => optional($user->last_login_at)->toDateTimeString(),
        ];
    }
}
