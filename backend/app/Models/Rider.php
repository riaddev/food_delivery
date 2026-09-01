<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use App\Models\RiderLocation;

class Rider extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'vehicle_description',
        'date_of_birth',
        'nid_number',
        'nid_document',
        'emergency_contact_name',
        'emergency_contact_number',
        'license_number',
        'license_document',
        'vehicle_registration',
        'delivery_area',
        'address',
        'city',
        'phone',
        'status',
        'is_online',
    ];

    protected $appends = ['nid_document_url', 'license_document_url'];

    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
        ];
    }

    public function getNidDocumentUrlAttribute(): ?string
    {
        return $this->resolveUrl($this->nid_document);
    }

    public function getLicenseDocumentUrlAttribute(): ?string
    {
        return $this->resolveUrl($this->license_document);
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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(RiderLocation::class);
    }
}