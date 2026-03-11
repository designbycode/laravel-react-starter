<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

it('authorizes private user channel for the same user', function (): void {
    $user = User::factory()->create();
    actingAs($user);

    $response = post('/broadcasting/auth', [
        'channel_name' => "private-App.Models.User.{$user->id}",
        'socket_id' => '1234.5678',
    ]);

    $response->assertOk();
});

it('denies private user channel for a different user', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    actingAs($user);

    $response = post('/broadcasting/auth', [
        'channel_name' => "private-App.Models.User.{$other->id}",
        'socket_id' => '1234.5678',
    ]);

    $response->assertForbidden();
});
