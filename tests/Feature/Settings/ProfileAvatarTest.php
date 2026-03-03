<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('allows authenticated user to upload their own avatar', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('profile.avatar.upload'), [
            'avatar' => UploadedFile::fake()->image('me.jpg', 200, 200),
        ])
        ->assertNoContent();

    expect($user->fresh()->getFirstMedia('avatar'))->not()->toBeNull();
});

it('allows authenticated user to delete their avatar', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    // seed avatar
    $this->actingAs($user)
        ->post(route('profile.avatar.upload'), [
            'avatar' => UploadedFile::fake()->image('me.jpg', 200, 200),
        ])->assertNoContent();

    expect($user->fresh()->getFirstMedia('avatar'))->not()->toBeNull();

    $this->actingAs($user)
        ->delete(route('profile.avatar.delete'))
        ->assertNoContent();

    expect($user->fresh()->getFirstMedia('avatar'))->toBeNull();
});

it('prevents guests from uploading avatar', function () {
    Storage::fake('public');

    $this->post(route('profile.avatar.upload'), [
        'avatar' => UploadedFile::fake()->image('guest.jpg', 200, 200),
    ])->assertRedirect();
});
