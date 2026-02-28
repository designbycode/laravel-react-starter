<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->times(1000)
            ->state(new Sequence(
                fn ($sequence) => ['created_at' => now()->subDays($sequence->index)],
            ))
            ->create();
    }
}
