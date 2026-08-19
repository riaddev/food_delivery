<?php

namespace App\Providers;

use App\Support\Tunnel;
use Illuminate\Support\ServiceProvider;

class TunnelServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        if (!config('sslcommerz.sandbox') || !config('sslcommerz.tunnel_autostart')) {
            return;
        }

        if (!Tunnel::isRunning()) {
            Tunnel::start();
        }
    }
}