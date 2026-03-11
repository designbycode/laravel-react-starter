<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes();

Broadcast::channel('App.Models.User.{id}', function ($user, int $id): bool {
    return (int) ($user?->id) === (int) $id;
});
