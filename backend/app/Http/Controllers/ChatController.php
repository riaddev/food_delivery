<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ChatController extends Controller
{
    private const MAX_HISTORY = 6;

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array|max:' . self::MAX_HISTORY,
            'history.*.role' => 'required|in:user,assistant',
            'history.*.text' => 'required|string|max:2000',
        ]);

        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-3.6-flash');

        if (!$apiKey) {
            return response()->json([
                'reply' => 'Swift AI is not configured yet. Please ask the administrator to add a Gemini API key.',
                'dishes' => [],
                'code' => 'not_configured',
            ], 503);
        }

        $contents = [];

        foreach (array_slice($validated['history'] ?? [], -self::MAX_HISTORY) as $turn) {
            $contents[] = [
                'role' => $turn['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $turn['text']]],
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $validated['message']]],
        ];

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $this->systemPrompt()]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 1024,
                'thinkingConfig' => [
                    'thinkingLevel' => 'minimal',
                ],
            ],
        ];

        try {
            $response = $this->askGemini($model, $apiKey, $payload);

            if ($response === null) {
                return $this->failure(
                    'Swift AI is taking too long to answer. Please try again.',
                    'upstream_timeout',
                    504
                );
            }

            if ($response->status() === 429) {
                Log::warning('Gemini rate limited');

                return $this->failure(
                    'Swift AI is handling many requests right now. Please wait a few seconds and try again.',
                    'upstream_rate_limited',
                    429
                );
            }

            if ($response->failed()) {
                Log::warning('Gemini API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 500),
                ]);

                return $this->failure(
                    'Sorry, Swift AI is having trouble right now. Please try again in a moment.',
                    'upstream_error',
                    502
                );
            }

            $data = $response->json();

            $reply = trim(collect($data['candidates'][0]['content']['parts'] ?? [])
                ->pluck('text')
                ->implode(''));

            if ($reply === '') {
                if (!empty($data['promptFeedback']['blockReason'])) {
                    return response()->json([
                        'reply' => 'Sorry, I cannot answer that. Please try rephrasing your question.',
                        'dishes' => [],
                        'code' => 'blocked',
                    ]);
                }

                return response()->json([
                    'reply' => 'Sorry, I could not generate an answer. Please try rephrasing your question.',
                    'dishes' => [],
                    'code' => 'empty',
                ]);
            }

            $dishes = $this->extractDishes($reply);

            return response()->json(['reply' => $reply, 'dishes' => $dishes, 'code' => 'ok']);
        } catch (Throwable $e) {
            Log::error('Chat request failed', ['error' => $this->sanitize($e->getMessage())]);

            return $this->failure(
                'Sorry, Swift AI is unavailable right now. Please try again later.',
                'unavailable',
                503
            );
        }
    }

    /**
     * Call Gemini with one automatic retry on timeouts and transient
     * upstream errors. Returns null when every attempt timed out.
     * 429 is NOT retried — refiring into a rate-limit window only
     * adds latency and guarantees a second 429.
     */
    private function askGemini(string $model, string $apiKey, array $payload): mixed
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $response = null;
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            if ($attempt > 1) {
                usleep(800 * 1000);
            }

            try {
                $response = Http::timeout(15)->post($url . '?key=' . $apiKey, $payload);
            } catch (ConnectionException $e) {
                Log::warning('Gemini request timed out', [
                    'attempt' => $attempt,
                    'error' => $this->sanitize($e->getMessage()),
                ]);
                $response = null;

                continue;
            }

            if (!$this->isRetryable($response->status())) {
                break;
            }

            Log::warning('Gemini transient error, will retry once', [
                'attempt' => $attempt,
                'status' => $response->status(),
            ]);
        }

        return $response;
    }

    private function isRetryable(int $status): bool
    {
        return in_array($status, [408, 500, 502, 503, 504], true);
    }

    private function failure(string $reply, string $code, int $status): JsonResponse
    {
        return response()->json([
            'reply' => $reply,
            'dishes' => [],
            'code' => $code,
        ], $status);
    }

    /**
     * Strip API keys from messages before logging — exception text from
     * the HTTP client contains the full request URL including ?key=.
     */
    private function sanitize(string $message): string
    {
        $clean = preg_replace('/([?&]key=)[^&\\s"\']+/', '$1***', $message);

        return Str::limit(is_string($clean) ? $clean : '', 300);
    }

    private function systemPrompt(): string
    {
        $catalog = $this->menuCatalog();

        $rules = <<<'TXT'
You are "Swift AI", the friendly assistant for SwiftBite, a food delivery platform.

STRICT GROUNDING RULES (you must never break these):
1. ONLY recommend dishes, restaurants and prices that appear in the MENU CATALOG below.
2. NEVER invent or imagine dishes, restaurant names, prices, discounts or availability.
3. If a dish or restaurant is not in the catalog, say it is currently not available on SwiftBite and suggest a similar available alternative.
4. Quote prices exactly as they appear in the catalog, in BDT (৳).
5. Only describe items marked available; ignore or skip unavailable ones.
6. If asked something unrelated to food, restaurants or ordering, answer briefly and steer back to helping with an order.
7. If asked about order status, tracking, or delivery time: you cannot see live orders — tell them to open My Orders / use the tracking link, then offer food help.
8. Keep answers short and helpful: 2-5 sentences maximum. Never reply with only "sorry" — always offer an alternative or next step.
9. Each catalog line starts with its dish ID like "#12". When you recommend specific dishes, end your reply with one final line listing their IDs in exactly this format:
DISHES: 12, 45
Use at most 4 IDs, only IDs that appear in the catalog, and never mention or explain this line to the user. Do not add a period after the IDs. If your answer does not recommend specific dishes, omit the line.
TXT;

        if ($catalog === '') {
            $catalog = '(No menu data is available right now.)';
        }

        return $rules . "\n\nMENU CATALOG:\n" . $catalog;
    }

    private function menuCatalog(): string
    {
        // Cached + trimmed: the full catalog on every message made
        // requests slow and prone to upstream timeouts (the main cause of
        // "sorry" replies). 100 items keeps the prompt small and fast.
        // Dish cards are still validated live in extractDishes(), so a
        // 30-minute-old catalog is safe.
        try {
            $lines = Cache::remember('chat_menu_catalog', now()->addMinutes(30), function () {
                return MenuItem::query()
                    ->where('is_available', true)
                    ->with('restaurant:id,restaurant_name')
                    ->orderBy('restaurant_id')
                    ->limit(100)
                    ->get()
                    ->map(function (MenuItem $item) {
                        $line = sprintf(
                            '#%d %s — %s BDT @ %s (%s)',
                            $item->id,
                            $item->name,
                            number_format((float) $item->price, 0),
                            optional($item->restaurant)->restaurant_name ?? 'Unknown restaurant',
                            $item->category ?: 'Other'
                        );

                        if ($item->description) {
                            $line .= ' — ' . Str::limit($item->description, 50);
                        }

                        return $line;
                    });
            });
        } catch (Throwable) {
            return '';
        }

        return $lines->implode("\n");
    }

    private function extractDishes(string &$reply): array
    {
        // Tolerant: model sometimes adds a trailing period ("DISHES: 12.")
        // or extra whitespace. Old strict regex dropped the cards entirely.
        if (!preg_match('/DISHES:\s*([\d\s,]+)[\s.]*$/i', $reply, $matches)) {
            return [];
        }

        $reply = trim((string) preg_replace('/\s*DISHES:\s*[\d\s,\.]+\s*$/i', '', $reply));

        $ids = collect(explode(',', $matches[1]))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->unique()
            ->take(4);

        if ($ids->isEmpty()) {
            return [];
        }

        return MenuItem::query()
            ->whereIn('id', $ids)
            ->where('is_available', true)
            ->with('restaurant:id,restaurant_name')
            ->get()
            ->map(fn (MenuItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => '৳' . number_format((float) $item->price, 0),
                'image_url' => $item->image_url,
                'restaurant_id' => $item->restaurant_id,
                'restaurant_name' => optional($item->restaurant)->restaurant_name,
            ])
            ->values()
            ->all();
    }
}
