<?php

return [
    'store_id' => env('SSLCOMMERZ_STORE_ID'),
    'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),
    'sandbox' => env('SSLCOMMERZ_SANDBOX', true),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'tunnel_autostart' => env('SSLCOMMERZ_TUNNEL_AUTOSTART', true),
    'tunnel_path' => env('CLOUDFLARED_PATH', 'C:\Users\Lenovo\AppData\Local\cloudflared\cloudflared.exe'),
    'tunnel_log' => env('CLOUDFLARED_LOG', storage_path('logs/cloudflared.log')),
    'tunnel_port' => env('CLOUDFLARED_PORT', 8000),

    'gateway_url' => env('SSLCOMMERZ_SANDBOX', true)
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',

    'validator_url' => env('SSLCOMMERZ_SANDBOX', true)
        ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php',
];