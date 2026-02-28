<?php

use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Ensure base roles/permissions exist
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
});

function makeAdmin(): User
{
    $admin = User::factory()->create([
        'email' => 'admin-'.Str::uuid().'@example.com',
        'name' => 'Admin Test',
    ]);
    $admin->assignRole('admin');

    return $admin;
}

function makeModerator(): User
{
    $user = User::factory()->create([
        'email' => 'mod-'.Str::uuid().'@example.com',
        'name' => 'Moderator Test',
    ]);
    $user->assignRole('moderator');

    return $user;
}

it('allows admin to list users with filters', function () {
    $admin = makeAdmin();
    $u1 = User::factory()->create(['name' => 'Alice Example', 'email' => 'alice@example.com']);
    $u2 = User::factory()->create(['name' => 'Bob Builder', 'email' => 'bob@example.com']);
    // Ban u2
    $u2->forceFill(['is_banned' => true, 'banned_at' => now(), 'ban_reason' => 'Test'])->save();

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'Alice']))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['status' => 'banned']))
        ->assertOk();
});

it('creates a user with roles and verified flag', function () {
    $admin = makeAdmin();

    $payload = [
        'name' => 'Charlie',
        'email' => 'charlie@example.com',
        'password' => 'password123',
        'roles' => ['user'],
        'email_verified' => true,
    ];

    $this->actingAs($admin)
        ->post(route('admin.users.store'), $payload)
        ->assertRedirect();

    $created = User::where('email', 'charlie@example.com')->firstOrFail();
    expect($created->hasRole('user'))->toBeTrue();
    expect($created->email_verified_at)->not->toBeNull();
});

it('updates a user including roles and email verification', function () {
    $admin = makeAdmin();
    $user = User::factory()->create(['email' => 'target@example.com']);

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Target Renamed',
            'email_verified' => true,
            'roles' => ['moderator'],
        ])->assertSessionHasNoErrors()->assertRedirect();

    $user->refresh();
    expect($user->name)->toBe('Target Renamed');
    expect($user->hasRole('moderator'))->toBeTrue();
    expect($user->email_verified_at)->not->toBeNull();
});

it('soft deletes and restores a user', function () {
    $admin = makeAdmin();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertRedirect();

    expect($user->fresh()->deleted_at)->not->toBeNull();

    $this->actingAs($admin)
        ->post(route('admin.users.restore', $user))
        ->assertRedirect();

    expect($user->fresh()->deleted_at)->toBeNull();
});

it('bans and unbans a user', function () {
    $admin = makeAdmin();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.ban', $user), [
            'reason' => 'Violation',
            'until' => now()->addDay()->toDateTimeString(),
        ])->assertRedirect();

    $user->refresh();
    expect($user->is_banned)->toBeTrue();
    expect($user->ban_reason)->toBe('Violation');

    $this->actingAs($admin)
        ->post(route('admin.users.unban', $user))
        ->assertRedirect();

    $user->refresh();
    expect($user->is_banned)->toBeFalse();
    expect($user->ban_reason)->toBeNull();
});

it('performs bulk actions (delete, restore, assign role)', function () {
    $admin = makeAdmin();
    $u1 = User::factory()->create();
    $u2 = User::factory()->create();

    // delete
    $this->actingAs($admin)
        ->post(route('admin.users.bulk'), [
            'action' => 'delete',
            'ids' => [$u1->id, $u2->id],
        ])->assertRedirect();

    expect(User::withTrashed()->find($u1->id)->deleted_at)->not->toBeNull();

    // restore
    $this->actingAs($admin)
        ->post(route('admin.users.bulk'), [
            'action' => 'restore',
            'ids' => [$u1->id, $u2->id],
        ])->assertRedirect();

    expect(User::withTrashed()->find($u1->id)->deleted_at)->toBeNull();

    // assign role
    $this->actingAs($admin)
        ->post(route('admin.users.bulk'), [
            'action' => 'assign-role',
            'ids' => [$u1->id, $u2->id],
            'role' => 'user',
        ])->assertRedirect();

    expect($u1->fresh()->hasRole('user'))->toBeTrue();
});

it('prevents deleting yourself', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertForbidden();
});

it('prevents deleting the last admin', function () {
    $admin = makeAdmin();

    // Only one admin exists
    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertForbidden();
});

it('prevents banning yourself', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)
        ->post(route('admin.users.ban', $admin), ['reason' => 'Nope'])
        ->assertForbidden();
});

it('allows admin to impersonate a lower-ranked user and blocks lower to higher', function () {
    $admin = makeAdmin();
    $moderator = makeModerator();

    // moderator cannot impersonate admin
    $this->actingAs($moderator)
        ->post(route('admin.users.impersonate', $admin))
        ->assertForbidden();

    // admin can impersonate moderator
    $this->actingAs($admin)
        ->post(route('admin.users.impersonate', $moderator))
        ->assertRedirect();
});
