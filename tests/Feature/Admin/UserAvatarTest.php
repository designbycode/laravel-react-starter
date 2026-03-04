<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
});

function makeAdminUser(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

it('allows admin to upload avatar for another user', function () {
    Storage::fake('public');

    $admin = makeAdminUser();
    $target = User::factory()->create();

    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

    $this->actingAs($admin)
        ->post(route('admin.users.avatar.upload', $target), [
            'avatar' => $file,
        ])
        ->assertOk();

    $target->refresh();
    expect($target->getFirstMedia('avatar'))->not()->toBeNull();
});

it('prevents non-admin from changing another user avatar', function () {
    $normal = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($normal)
        ->post(route('admin.users.avatar.upload', $target), [
            'avatar' => UploadedFile::fake()->image('bad.jpg', 100, 100),
        ])
        ->assertForbidden();

    $this->actingAs($normal)
        ->delete(route('admin.users.avatar.delete', $target))
        ->assertForbidden();
});

it('allows admin to delete avatar for another user', function () {
    Storage::fake('public');

    $admin = makeAdminUser();
    $target = User::factory()->create();

    // Seed an avatar first
    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);
    $this->actingAs($admin)
        ->post(route('admin.users.avatar.upload', $target), [
            'avatar' => $file,
        ])->assertOk();

    expect($target->fresh()->getFirstMedia('avatar'))->not()->toBeNull();

    $this->actingAs($admin)
        ->delete(route('admin.users.avatar.delete', $target))
        ->assertOk();

    expect($target->fresh()->getFirstMedia('avatar'))->toBeNull();
});
