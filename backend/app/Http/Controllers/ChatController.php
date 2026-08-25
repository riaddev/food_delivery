<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $model = config('services.gemini.model', 'gemini-2.0-flash');

        if (!$apiKey) {
            return response()->json([
                'reply' => 'Swift AI is not configured yet. Please ask the administrator to add a Gemini API key.',
                'dishes' => [],
            ]);
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
            $response = Http::timeout(20)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", $payload);

            if ($response->failed()) {
                Log::warning('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);

                return response()->json([
                    'reply' => 'Sorry, Swift AI is having trouble right now. Please try again in a moment.',
                    'dishes' => [],
                ]);
            }

            $reply = trim(collect($response->json('candidates.0.content.parts') ?? [])
                ->pluck('text')
                ->implode(''));

            if ($reply === '') {
                return response()->json([
                    'reply' => 'Sorry, I could not generate an answer. Please try rephrasing your question.',
                    'dishes' => [],
                ]);
            }

            $dishes = $this->extractDishes($reply);

            return response()->json(['reply' => $reply, 'dishes' => $dishes]);
        } catch (Throwable $e) {
            Log::error('Chat request failed', ['error' => $e->getMessage()]);

            return response()->json([
                'reply' => 'Sorry, Swift AI is unavailable right now. Please try again later.',
                'dishes' => [],
            ]);
        }
    }

    private function systemPrompt(): string
    {
        $catalog = $this->menuCatalog();

        $rules = <<<'TXT'
You are "Swift AI", the friendly assistant for SwiftBite, a food delivery platform.

STRICT GROUNDING RULES (you must never break these):
1. ONLY recommend dishes, restaurants and prices that appear in the MENU CATALOG below.
2. NEVER invent or imagine dishes, restaurant names, prices, discounts or availability.
3. If a dish or restaurant is not in the catalog, say it is currently not available on SwiftBite.
4. Quote prices exactly as they appear in the catalog, in BDT (৳).
5. Only describe items marked available; ignore or skip unavailable ones.
6. If asked something unrelated to food, restaurants or ordering, answer briefly and steer back to helping with an order.
7. Keep answers short and helpful: 2-5 sentences maximum.
8. Each catalog line starts with its dish ID like "#12". When you recommend specific dishes, end your reply with one final line listing their IDs in exactly this format:
DISHES: 12, 45
Use at most 4 IDs, only IDs that appear in the catalog, and never mention or explain this line to the user. If your answer does not recommend specific dishes, omit the line.
TXT;

        if ($catalog === '') {
            $catalog = '(No menu data is available right now.)';
        }

        return $rules . "\n\nMENU CATALOG:\n" . $catalog;
    }

    private function menuCatalog(): string
    {
        return MenuItem::query()
            ->where('is_available', true)
            ->with('restaurant:id,restaurant_name')
            ->orderBy('restaurant_id')
            ->limit(300)
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
                    $line .= ' — ' . Str::limit($item->description, 80);
                }

                return $line;
            })
            ->implode("\n");
    }

    private function extractDishes(string &$reply): array
    {
        if (!preg_match('/DISHES:\s*([\d\s,]+)\s*$/i', $reply, $matches)) {
            return [];
        }

        $reply = trim(substr($reply, 0, strlen($reply) - strlen($matches[0])));

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
