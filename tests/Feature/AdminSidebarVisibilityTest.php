<?php

use App\Models\User;

it('does not show Admin link for non-admin users', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Visit a page that renders the sidebar (dashboard or settings) - using dashboard here
    $response = $this->get(route('dashboard'));

    $response->assertInertia(function ($page): void {
        // Frontend hides Admin link when no roles/permissions are present
        $page->where('auth.user.roles', [])
            ->where('auth.permissions', []);
    });
});

it('shows Admin link for admin users and allows accessing admin dashboard', function (): void {
    $user = User::factory()->create();
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
    $user->assignRole('admin');

    $this->actingAs($user);

    // Sidebar visibility is client-driven based on shared props, verify props reflect admin role
    $response = $this->get(route('dashboard'));
    $response->assertInertia(function ($page): void {
        $page->where('auth.user.roles.0.name', 'admin');
    });

    // Access admin dashboard
    $this->get(route('admin.dashboard'))
        ->assertOk();
});
