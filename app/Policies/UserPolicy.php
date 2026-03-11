<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    protected array $ranks = [
        'admin' => 3,
        'moderator' => 2,
        'user' => 1,
    ];

    protected function isLastAdmin(User $model): bool
    {
        if (! $model->hasRole('admin')) {
            return false;
        }

        return User::role('admin')->whereNull('deleted_at')->count() <= 1;
    }

    protected function rankOf(User $user): int
    {
        foreach (array_keys($this->ranks) as $role) {
            if ($user->hasRole($role)) {
                return $this->ranks[$role];
            }
        }

        return 0;
    }

    public function ban(User $user, User $model): bool
    {
        if ($user->is($model)) {
            return false;
        }
        if ($this->isLastAdmin($model)) {
            return false;
        }

        return $user->can('edit users');
    }

    public function unban(User $user, User $model): bool
    {
        return $user->can('edit users');
    }

    public function assignRoles(User $user, User $model): bool
    {
        return $user->can('assign roles');
    }

    public function removeRoles(User $user, User $model): bool
    {
        return $user->can('remove roles');
    }

    public function impersonate(User $user, User $model): bool
    {
        if (! $user->can('impersonate users')) {
            return false;
        }
        if ($user->is($model)) {
            return false;
        }

        return $this->rankOf($user) > $this->rankOf($model);
    }

    public function bulk(User $user): bool
    {
        return $user->can('edit users') || $user->can('delete users');
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view users');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->can('view users');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('create users');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->can('edit users');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        if ($user->is($model)) {
            return false;
        }
        if ($this->isLastAdmin($model)) {
            return false;
        }

        return $user->can('delete users');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return $user->can('delete users');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return false;
    }
}
