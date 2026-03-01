<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Users\BanUserRequest;
use App\Http\Requests\Admin\Users\BulkActionRequest;
use App\Http\Requests\Admin\Users\IndexRequest;
use App\Http\Requests\Admin\Users\RoleChangeRequest;
use App\Http\Requests\Admin\Users\StoreUserRequest;
use App\Http\Requests\Admin\Users\UpdateUserRequest;
use App\Models\User;
use App\Services\Admin\UserService;
use Inertia\Inertia;
use Inertia\Response;

class UserAdminController extends Controller
{
    public function __construct(protected UserService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(IndexRequest $request): Response
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 25);
        $users = $this->service->list($filters)->paginate($perPage)->onEachSide(3)->withQueryString();

        $roles = \Spatie\Permission\Models\Role::query()->pluck('name');

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => $roles,
            'can' => [
                'create' => $request->user()->can('create users'),
                'edit' => $request->user()->can('edit users'),
                'delete' => $request->user()->can('delete users'),
                'impersonate' => $request->user()->can('impersonate users'),
                'assign_roles' => $request->user()->can('assign roles'),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);
        $user = $this->service->create($request->validated());

        return redirect()->route('admin.users.edit', $user)->with('success', 'User created');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        $roles = \Spatie\Permission\Models\Role::query()->pluck('name');

        return Inertia::render('admin/users/create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        $this->authorize('view', $user);
        $user->load('roles');

        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        $user->load('roles');
        $roles = \Spatie\Permission\Models\Role::query()->pluck('name');

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);
        $this->service->update($user, $request->validated());

        return back()->with('success', 'User updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        $this->service->delete($user);

        return back()->with('success', 'User deleted');
    }

    public function restore(string $user)
    {
        $model = User::withTrashed()->where('uuid', $user)->firstOrFail();
        $this->authorize('restore', $model);
        $this->service->restore($model);

        return back()->with('success', 'User restored');
    }

    public function ban(BanUserRequest $request, User $user)
    {
        $this->authorize('ban', $user);
        $data = $request->validated();
        $this->service->ban($user, $data['reason'], $data['until'] ?? null);

        return back()->with('success', 'User banned');
    }

    public function unban(User $user)
    {
        $this->authorize('unban', $user);
        $this->service->unban($user);

        return back()->with('success', 'User unbanned');
    }

    public function assignRole(RoleChangeRequest $request, User $user)
    {
        $this->authorize('assignRoles', $user);
        $this->service->assignRole($user, $request->validated('role'));

        return back()->with('success', 'Role assigned');
    }

    public function removeRole(RoleChangeRequest $request, User $user)
    {
        $this->authorize('removeRoles', $user);
        $this->service->removeRole($user, $request->validated('role'));

        return back()->with('success', 'Role removed');
    }

    public function bulk(BulkActionRequest $request)
    {
        $this->authorize('bulk', User::class);
        $data = $request->validated();
        $this->service->bulk($data['action'], $data['ids'], $data['role'] ?? null);

        return back()->with('success', 'Bulk action completed');
    }

    public function impersonate(User $user)
    {
        $this->authorize('impersonate', $user);
        auth()->user()->impersonate($user);

        return redirect()->route('dashboard');
    }

    public function stopImpersonating()
    {
        if (auth()->check() && method_exists(auth()->user(), 'leaveImpersonation')) {
            auth()->user()->leaveImpersonation();
        } else {
            // Fallback: clear common impersonation session flags and restore original user if stored
            foreach (['impersonator_id', 'impersonated_by', 'impersonate'] as $key) {
                if (session()->has($key)) {
                    session()->forget($key);
                }
            }
        }

        return redirect()->route('dashboard')->with('flash', ['type' => 'success', 'message' => 'Stopped impersonating']);
    }
}
