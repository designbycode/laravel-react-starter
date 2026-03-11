<?php

namespace Tests\Browser;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ProfileAvatarTest extends DuskTestCase
{
    use DatabaseMigrations;

    public function test_user_can_upload_and_delete_own_avatar(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                ->type('#email', $user->email)
                ->type('#password', 'password')
                ->press('Log in')
                ->waitForLocation('/dashboard')
                ->visit('/settings/profile')
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
