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
        'area',
        'city',
        'phone',
        'description',
        'opening_hours',
        'opening_time',
        'closing_time',
        'operating_days',
        'image',
        'cover_image',
        'logo',
        'delivery_time',
        'status',
        'delivery_fee',
        'default_max_per_item',
        'allow_bulk_orders',
        'accepts_dine_in',
        'latitude',
        'longitude',
    ];

    protected $appends = ['image_url', 'cover_image_url', 'logo_url'];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'decimal:2',
            'accepts_dine_in' => 'boolean',
            'allow_bulk_orders' => 'boolean',
            'default_max_per_item' => 'integer',
        ];
    }

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

        // Relative URL: works regardless of APP_URL (tunnels expire) and
        // lets the frontend serve it via same-origin / vite /storage proxy.
        return '/storage/'.ltrim($value, '/');
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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class);
    }
}
