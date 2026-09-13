<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class Tunnel
{
    public static function isRunning(): bool
    {
        exec('tasklist /FI "IMAGENAME eq cloudflared.exe" /NH 2>NUL', $output);
        return collect($output)->contains(fn ($line) => str_contains($line, 'cloudflared.exe'));
    }

    public static function start(): bool
    {
        $exe = config('sslcommerz.tunnel_path');
        $log = config('sslcommerz.tunnel_log');
        $port = config('sslcommerz.tunnel_port');

        if (!file_exists($exe) || !is_dir(dirname($log))) {
            Log::warning('Tunnel auto-start skipped: cloudflared path or log directory missing.');
            return false;
        }

        $command = sprintf(
            'start /b "" "%s" tunnel --url http://localhost:%s --no-autoupdate >> "%s" 2>&1',
            $exe,
            $port,
            $log
        );

        pclose(popen($command, 'r'));
        Log::info('Tunnel auto-start: cloudflared launched.');

        return true;
    }

    public static function currentUrl(): ?string
    {
        $log = config('sslcommerz.tunnel_log');

        if (!file_exists($log)) {
            return null;
        }

        $content = file_get_contents($log);
        // Quick-tunnel URL is printed once at startup; the log can grow past
        // 8KB with metrics/DNS noise, pushing the URL out of the tail window
        // and forcing a fallback to a stale APP_URL. Keep a larger window.
        $content = $content === false ? '' : substr($content, -131072);

        if (preg_match_all('/https:\/\/[a-z0-9-]+\.trycloudflare\.com/', $content, $matches)) {
            return rtrim(end($matches[0]), '/');
        }

        return null;
    }
}