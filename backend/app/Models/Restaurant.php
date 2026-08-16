<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        'restaurant_name',
        'cuisine_type',
        'address',
        'city',
        'phone',
        'description',
        'opening_hours',
        'image',
        'cover_image',
        'logo',
        'delivery_time',
        'status',
        'delivery_fee',
        'accepts_dine_in',
    ];

    protected $appends = ['image_url', 'cover_image_url', 'logo_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->resolveUrl($this->image);
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->resolveUrl($this->cover_image);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->resolveUrl($this->logo);
    }

    private function resolveUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
