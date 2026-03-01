<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use function activity;

class ImpersonationController extends Controller
{
    /**
     * Start impersonating a user.
     */
    public function start(Request $request, User $user): RedirectResponse
    {
        $originalUser = Auth::user();

        // Prevent impersonating yourself
        if ($originalUser->uuid === $user->uuid) {
            return back()->with('error', 'You cannot impersonate yourself.');
        }

        // Store the original user ID in session
        session(['impersonate_original_user' => $originalUser->uuid]);

        // Login as the target user
        $originalUser->impersonate($user);

        activity()
            ->performedOn($user)
            ->causedBy($originalUser)
            ->log('Started impersonating user');

        return redirect()->route('dashboard')->with('success', "You are now impersonating {$user->name}.");
    }

    /**
     * Stop impersonating and return to original user.
     */
    public function stop(Request $request): RedirectResponse
    {
        $originalUserId = session('impersonate_original_user');

        if (! $originalUserId) {
            return back()->with('error', 'You are not impersonating anyone.');
        }

        // Get the original user
        $originalUser = User::findOrFail($originalUserId);


        // Remove impersonation session
        session()->forget('impersonate_original_user');

        activity()
            ->causedBy($originalUser)
            ->log('Stopped impersonating user');

        // Login back as the original user
        Auth::user()->leaveImpersonation();

        return redirect()->route('admin.users.index')->with('success', 'Stopped impersonating.');
    }
}
