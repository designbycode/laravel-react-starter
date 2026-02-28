<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('exposes avatar_url in Inertia auth props after upload', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();
    $this->actingAs($user);

    // Upload avatar
    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);
    $this->post(route('profile.avatar.upload'), [
        'avatar' => $file,
    ])->assertRedirect();

    // Visit profile edit page and assert Inertia has avatar_url
    $response = $this->get(route('profile.edit'));

    $response->assertInertia(fn ($page) => $page
        ->where('auth.user.uuid', $user->uuid)
        ->has('auth.user.avatar_url')
        ->whereNot('auth.user.avatar_url', null)
    );
});
