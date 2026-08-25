<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'restaurant_id',
        'rider_id',
        'accepted_at',
        'status',
        'order_type',
        'total',
        'delivery_address',
        'delivery_instructions',
        'table_number',
        'payment_method',
        'payment_status',
        'tran_id',
        'val_id',
        'delivery_fee',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'delivered_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest();
    }
}
