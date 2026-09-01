<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class Geocoder
{
    private static array $cache = [];

    public static function geocode(string $address): ?array
    {
        if (empty($address)) {
            return null;
        }

        $cacheKey = 'geo:' . md5(strtolower(trim($address)));

        if (isset(self::$cache[$cacheKey])) {
            return self::$cache[$cacheKey];
        }

        $cached = Cache::get($cacheKey);
        if ($cached) {
            self::$cache[$cacheKey] = $cached;
            return $cached;
        }

        $queries = self::buildQueries($address);

        foreach ($queries as $query) {
            $result = self::queryNominatim($query);
            if ($result) {
                self::$cache[$cacheKey] = $result;
                Cache::put($cacheKey, $result, 86400);
                return $result;
            }
        }

        return null;
    }

    private static function buildQueries(string $address): array
    {
        $queries = [$address];
        $parts = array_filter(array_map('trim', explode(',', $address)));

        if (count($parts) > 2) {
            $queries[] = implode(', ', array_slice($parts, -2));
        }
        if (count($parts) > 1) {
            $queries[] = end($parts);
        }

        return array_unique($queries);
    }

    private static function queryNominatim(string $query): ?array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'SwiftBite/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $query,
                    'format' => 'json',
                    'limit' => 1,
                    'addressdetails' => 0,
                ]);

            if ($response->successful() && count($response->json()) > 0) {
                $result = $response->json()[0];
                return [
                    'lat' => (float) $result['lat'],
                    'lng' => (float) $result['lon'],
                ];
            }
        } catch (\Exception $e) {
            report($e);
        }

        return null;
    }
}
