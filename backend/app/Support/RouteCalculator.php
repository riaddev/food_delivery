<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RouteCalculator
{
    public static function getRoute(array $from, array $to): ?array
    {
        $cacheKey = 'route:' . md5("{$from['lat']},{$from['lng']}:{$to['lat']},{$to['lng']}");

        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $url = sprintf(
                'https://router.project-osrm.org/route/v1/driving/%s,%s;%s,%s?overview=full&geometries=polyline&steps=false',
                $from['lng'],
                $from['lat'],
                $to['lng'],
                $to['lat']
            );

            $response = Http::timeout(8)->get($url);

            if ($response->successful()) {
                $data = $response->json();

                if (($data['code'] ?? '') === 'Ok' && isset($data['routes'][0])) {
                    $route = $data['routes'][0];

                    $result = [
                        'distance_km' => round($route['distance'] / 1000, 2),
                        'duration_min' => (int) ceil($route['duration'] / 60),
                        'polyline' => $route['geometry'],
                    ];

                    Cache::put($cacheKey, $result, 3600);

                    return $result;
                }
            }
        } catch (\Exception $e) {
            report($e);
        }

        return null;
    }
}
