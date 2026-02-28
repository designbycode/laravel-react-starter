<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('uploads an avatar for the authenticated user', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user);

    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

    $response = $this->post(route('profile.avatar.upload'), [
        'avatar' => $file,
    ]);

    $response->assertRedirect();

    $user->refresh();

    $media = $user->getFirstMedia('avatar');

    expect($media)->not->toBeNull();

    // Original file exists on the public disk
    Storage::disk('public')->assertExists($media->getPathRelativeToRoot());
});

it('deletes an existing avatar for the authenticated user', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user);

    // First upload an avatar
    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

    $this->post(route('profile.avatar.upload'), [
        'avatar' => $file,
    ])->assertRedirect();

    $user->refresh();

    $media = $user->getFirstMedia('avatar');

    expect($media)->not->toBeNull();

    // Now delete the avatar
    $response = $this->delete(route('profile.avatar.delete'));

    $response->assertRedirect();

    $user->refresh();

    expect($user->getFirstMedia('avatar'))->toBeNull();
});
