<?php

namespace App\Models;

use App\Observers\UserObserver;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Traits\HasRoles;


#[ObservedBy([UserObserver::class])]
class User extends Authenticatable implements HasMedia, MustVerifyEmail
{
    /**
     * Accessors that should be appended to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar_url',
    ];

    /** @use HasFactory<\\Database\\Factories\\UserFactory> */
    use HasFactory, HasRoles, InteractsWithMedia, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->useDisk('public');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        // Avatar conversions (cropped square)
        $this
            ->addMediaConversion('small')
            ->width(120)
            ->height(120)
            ->fit(Fit::Crop, 120, 120)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('avatar');

        $this
            ->addMediaConversion('medium')
            ->width(300)
            ->height(300)
            ->fit(Fit::Crop, 300, 300)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('avatar');

        $this
            ->addMediaConversion('large')
            ->width(1200)
            ->height(1200)
            ->fit(Fit::Crop, 1200, 1200)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('avatar');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        $media = $this->getFirstMedia('avatar');

        return $media?->getUrl('medium');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'uuid' => 'string',
        ];
    }
}
