<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantTable extends Model
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_DISABLED = 'disabled';

    protected $fillable = [
        'restaurant_id',
        'name',
        'seats',
        'status',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
