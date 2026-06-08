<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%' . $request->search . '%';
                $query->where('name', 'like', $term)->orWhere('email', 'like', $term);
            })
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return $this->publicUser($user);
            });

        return response()->json([
            'results' => 'SUCCESS',
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'viewer'])],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => true,
            'api_token' => Str::random(60),
        ]);

        Audit::record('user.created', "Created user {$user->email}", ['role' => $user->role], [
            'category' => 'user',
            'subject_type' => 'User',
            'subject_id' => $user->id,
        ]);

        return response()->json([
            'results' => 'SUCCESS',
            'data' => $this->publicUser($user),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'sometimes|nullable|string|min:8',
            'role' => ['sometimes', Rule::in(['admin', 'viewer'])],
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('password', $data)) {
            if ($data['password']) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }
        }

        $before = $this->publicUser($user);
        $user->fill($data)->save();

        Audit::record('user.updated', "Updated user {$user->email}", [
            'before' => $before,
            'after' => $this->publicUser($user),
        ], [
            'category' => 'user',
            'subject_type' => 'User',
            'subject_id' => $user->id,
        ]);

        return response()->json([
            'results' => 'SUCCESS',
            'data' => $this->publicUser($user),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'results' => 'FAILED',
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $email = $user->email;
        $user->delete();

        Audit::record('user.deleted', "Deleted user {$email}", [], [
            'category' => 'user',
            'subject_type' => 'User',
            'subject_id' => $user->id,
        ]);

        return response()->json(['results' => 'SUCCESS']);
    }

    public function rotateToken(Request $request, User $user)
    {
        $user->api_token = Str::random(60);
        $user->save();

        Audit::record('user.token_rotated', "Rotated API token for {$user->email}", [], [
            'category' => 'security',
            'subject_type' => 'User',
            'subject_id' => $user->id,
        ]);

        return response()->json([
            'results' => 'SUCCESS',
            'token' => $user->api_token,
        ]);
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
            'created_at' => optional($user->created_at)->toDateTimeString(),
        ];
    }
}
