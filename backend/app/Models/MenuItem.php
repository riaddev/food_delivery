<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MenuItem extends Model
{
    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'price',
        'discount_price',
        'image',
        'category',
        'category_id',
        'is_available',
        'stock_quantity',
        'daily_cap',
        'max_per_order',
    ];

    protected $appends = ['image_url', 'effective_price', 'has_discount'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'is_available' => 'boolean',
            'stock_quantity' => 'integer',
            'daily_cap' => 'integer',
            'max_per_order' => 'integer',
        ];
    }

    public function isSoldOut(): bool
    {
        if (!$this->is_available) {
            return true;
        }

        return $this->stock_quantity !== null && (int) $this->stock_quantity <= 0;
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function menuCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function getEffectivePriceAttribute(): float
    {
        return $this->discount_price !== null ? (float) $this->discount_price : (float) $this->price;
    }

    public function getHasDiscountAttribute(): bool
    {
        return $this->discount_price !== null;
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
            return $this->image;
        }

        // Relative URL: works regardless of APP_URL (tunnels expire).
        return '/storage/'.ltrim($this->image, '/');
    }
}
