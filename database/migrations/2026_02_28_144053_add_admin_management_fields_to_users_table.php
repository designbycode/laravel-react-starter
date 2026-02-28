<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_banned')->default(false)->after('remember_token');
            $table->timestamp('banned_at')->nullable()->after('is_banned');
            $table->timestamp('banned_until')->nullable()->after('banned_at');
            $table->text('ban_reason')->nullable()->after('banned_until');
            $table->timestamp('last_login_at')->nullable()->after('ban_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_banned', 'banned_at', 'banned_until', 'ban_reason', 'last_login_at']);
        });
    }
};
