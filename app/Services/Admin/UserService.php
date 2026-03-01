<?php

namespace App\Services\Admin;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function list(array $filters = []): Builder
    {
        $query = User::query()->with(['roles'])->withTrashed();

        // Search by name/email
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(static function (Builder $q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Status filter: active|banned|deleted
        if ($status = ($filters['status'] ?? null)) {
            if ($status === 'deleted') {
                $query->onlyTrashed();
            } elseif ($status === 'banned') {
                $query->where('is_banned', true);
            } elseif ($status === 'active') {
                $query->whereNull('deleted_at')->where('is_banned', false);
            }
        }

        // Email verified filter: yes|no
        if (($verified = $filters['email_verified'] ?? null) !== null && $verified !== '') {
            if (in_array($verified, ['1', 'true', 'yes'], true)) {
                $query->whereNotNull('email_verified_at');
            } elseif (in_array($verified, ['0', 'false', 'no'], true)) {
                $query->whereNull('email_verified_at');
            }
        }

        // Role filter (by role name)
        if ($role = ($filters['role'] ?? null)) {
            $query->role($role);
        }

        // Sorting
        $sort = $filters['sort'] ?? null;
        $dir = $filters['direction'] ?? null;
        $direction = in_array($dir, ['asc', 'desc'], true) ? $dir : 'asc';
        if (in_array($sort, ['name', 'email', 'created_at'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderByDesc('id');
        }

        return $query;
    }

    public function create(array $data): User
    {
        $payload = [
            'uuid' => (string) Str::uuid(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ];

        if (Arr::get($data, 'email_verified')) {
            $payload['email_verified_at'] = now();
        }

        $user = User::query()->create($payload);

        if (! empty($data['roles'] ?? [])) {
            $user->syncRoles($data['roles']);
        }

        // Optional immediate ban on create
        if (! empty($data['ban']) && ! empty($data['ban']['reason'])) {
            $this->ban($user, $data['ban']['reason'], $data['ban']['until'] ?? null);
        }

        return $user->fresh(['roles']);
    }

    public function update(User $user, array $data): User
    {
        $updates = Arr::only($data, ['name', 'email']);

        if (! empty($data['password'])) {
            $updates['password'] = Hash::make($data['password']);
        }

        if (array_key_exists('email_verified', $data)) {
            $updates['email_verified_at'] = $data['email_verified'] ? now() : null;
        }

        $user->update($updates);

        if (array_key_exists('roles', $data)) {
            $user->syncRoles($data['roles'] ?? []);
        }

        // Optional immediate ban/unban on update
        if (! empty($data['ban']) && ! empty($data['ban']['reason'])) {
            $this->ban($user, $data['ban']['reason'], $data['ban']['until'] ?? null);
        }

        if (array_key_exists('unban', $data) && $data['unban']) {
            $this->unban($user);
        }

        return $user->fresh(['roles']);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function restore(User $user): void
    {
        $user->restore();
    }

    public function ban(User $user, string $reason, ?string $until = null): User
    {
        $untilTs = $until ? CarbonImmutable::parse($until) : null;
        $user->forceFill([
            'is_banned' => true,
            'banned_at' => now(),
            'banned_until' => $untilTs,
            'ban_reason' => $reason,
        ])->save();

        return $user->refresh();
    }

    public function unban(User $user): User
    {
        $user->forceFill([
            'is_banned' => false,
            'banned_at' => null,
            'banned_until' => null,
            'ban_reason' => null,
        ])->save();

        return $user->refresh();
    }

    public function assignRole(User $user, string $role): User
    {
        $user->assignRole($role);

        return $user->fresh(['roles']);
    }

    public function removeRole(User $user, string $role): User
    {
        $user->removeRole($role);

        return $user->fresh(['roles']);
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function bulk(string $action, array $ids, ?string $role = null): void
    {
        $users = User::withTrashed()->whereIn('id', $ids)->get();
        foreach ($users as $user) {
            match ($action) {
                'delete' => $user->delete(),
                'restore' => $user->restore(),
                'ban' => $this->ban($user, $role ?? 'Banned via bulk action'),
                'unban' => $this->unban($user),
                'assign-role' => $role ? $user->assignRole($role) : null,
                default => null,
            };
        }
    }
}
