<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    public const TYPES = [
        'rider_no_show',
        'wrong_food',
        'missing_items',
        'bad_quality',
        'rotten_food',
        'late_delivery',
        'other',
    ];

    public const STATUSES = [
        'open',
        'investigating',
        'resolved',
        'rejected',
    ];

    public const MAX_PHOTOS = 3;

    public const MAX_PHOTO_KB = 5120;

    protected $fillable = [
        'order_id',
        'user_id',
        'type',
        'description',
        'photos',
        'status',
        'resolution',
        'admin_note',
        'admin_id',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function getPhotoUrlsAttribute(): array
    {
        return collect($this->photos ?? [])
            ->map(fn ($path) => str_starts_with($path, 'http://') || str_starts_with($path, 'https://')
                ? $path
                : '/storage/' . ltrim($path, '/'))
            ->values()
            ->all();
    }
}
