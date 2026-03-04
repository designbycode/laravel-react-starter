<?php

namespace Tests\Browser;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AdminUserAvatarTest extends DuskTestCase
{
    use DatabaseMigrations;

    public function test_admin_can_upload_and_delete_other_user_avatar(): void
    {
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);

        $admin = User::factory()->create(['password' => bcrypt('password')]);
        $admin->assignRole('admin');
        $target = User::factory()->create();

        $this->browse(function (Browser $browser) use ($admin, $target) {
            $browser->visit('/login')
                ->type('#email', $admin->email)
                ->type('#password', 'password')
                ->press('Log in')
                ->waitForLocation('/dashboard')
                ->visit('/admin/users/'.$target->uuid.'/edit')
                ->waitFor('[data-test="avatar-input"]')
                ->attach('[data-test="avatar-input"]', __DIR__.'/fixtures/avatar-small.png')
                ->pause(2500)
                ->assertMissing('.inertia-error-overlay')
                ->waitFor('[data-test="avatar-delete"]', 10)
                ->press('Remove avatar')
                ->pause(2500)
                ->assertSee('Avatar removed');
        });
    }
}
