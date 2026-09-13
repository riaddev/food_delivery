<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\Tunnel;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SslCommerzController extends Controller
{
    private const CURRENCY = 'BDT';

    public function initiatePayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'amount' => 'required|numeric|min:1',
        ]);

        $order = Order::where('user_id', $request->user()->id)
            ->where('id', $validated['order_id'])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'This order has already been paid.'], 422);
        }

        if (abs((float) $validated['amount'] - (float) $order->total) > 0.01) {
            return response()->json(['message' => 'Amount does not match the order total.'], 422);
        }

        if (!filled(config('sslcommerz.store_id')) || !filled(config('sslcommerz.store_password'))) {
            return response()->json([
                'message' => 'Online payment is not configured. Please choose Cash on Delivery or contact support.',
            ], 503);
        }

        $tranId = 'FD' . time() . Str::upper(Str::random(6));
        $order->update(['tran_id' => $tranId]);

        $user = $request->user();

        $payload = [
            'store_id' => config('sslcommerz.store_id'),
            'store_passwd' => config('sslcommerz.store_password'),
            'total_amount' => (float) $order->total,
            'currency' => self::CURRENCY,
            'tran_id' => $tranId,
            'success_url' => $this->callbackUrl('/api/payment/success'),
            'fail_url' => $this->callbackUrl('/api/payment/fail'),
            'cancel_url' => $this->callbackUrl('/api/payment/cancel'),
            'ipn_url' => $this->callbackUrl('/api/payment/ipn'),
            'multi_card_name' => 'bkash,nagad,visacard,mastercard,amexcard',
            'cus_name' => $user->name ?: 'Customer',
            'cus_email' => $user->email ?: 'customer@example.com',
            'cus_phone' => $user->phone ?: '01700000000',
            'cus_add1' => $user->address ?: 'Dhaka',
            'cus_city' => 'Dhaka',
            'cus_country' => 'Bangladesh',
            'shipping_method' => in_array($order->order_type, ['dine_in', 'takeout']) ? 'NO' : 'YES',
            'ship_name' => $user->name ?: 'Customer',
            'ship_add1' => $user->address ?: 'Dhaka',
            'ship_city' => 'Dhaka',
            'ship_postcode' => '1200',
            'ship_country' => 'Bangladesh',
            'product_name' => 'Food order #' . $order->id,
            'product_category' => 'Food',
            'product_profile' => 'general',
        ];

        try {
            // Timeouts are critical: without them a slow sandbox hangs php
            // artisan serve (single worker) and the browser reports
            // ERR_EMPTY_RESPONSE instead of a JSON error.
            $response = Http::asForm()
                ->connectTimeout(5)
                ->timeout(15)
                ->post(config('sslcommerz.gateway_url'), $payload);
        } catch (ConnectionException $e) {
            Log::warning('SSLCommerz initiate timeout', [
                'order_id' => $order->id,
                'tran_id' => $tranId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment gateway timed out. Your order is saved as pending — please retry from My Orders or choose Cash on Delivery.',
            ], 503);
        }

        $data = $response->json();

        if (!$response->successful() || ($data['status'] ?? '') !== 'SUCCESS') {
            Log::warning('SSLCommerz initiate rejected', [
                'order_id' => $order->id,
                'tran_id' => $tranId,
                'http_status' => $response->status(),
                'gateway_status' => $data['status'] ?? null,
                'failedreason' => $data['failedreason'] ?? null,
            ]);

            return response()->json([
                'message' => 'Could not initiate payment: ' . ($data['failedreason'] ?? 'Unknown error from gateway.'),
            ], 422);
        }

        $gatewayUrl = $data['GatewayPageURL'] ?? $data['redirectGatewayURL'] ?? null;

        if (!$gatewayUrl) {
            Log::error('SSLCommerz initiate missing redirect URL', [
                'order_id' => $order->id,
                'tran_id' => $tranId,
                'gateway_response' => $data,
            ]);

            return response()->json([
                'message' => 'Payment gateway did not return a redirect URL. Please retry or choose Cash on Delivery.',
            ], 502);
        }

        return response()->json([
            'url' => $gatewayUrl,
            'tran_id' => $tranId,
        ]);
    }

    public function paymentSuccess(Request $request): RedirectResponse
    {
        $order = Order::where('tran_id', $request->input('tran_id'))->first();

        if ($order && $order->payment_status !== 'paid') {
            $this->validateAndMarkPaid($order, $request->input('val_id'));
        }

        return redirect(config('sslcommerz.frontend_url') . '/payment/success?order_id=' . ($order?->id ?? ''));
    }

    public function paymentFail(Request $request): RedirectResponse
    {
        $this->markPaymentFailed($request->input('tran_id'));

        return redirect(config('sslcommerz.frontend_url') . '/payment/failed');
    }

    public function paymentCancel(Request $request): RedirectResponse
    {
        $this->markPaymentFailed($request->input('tran_id'));

        return redirect(config('sslcommerz.frontend_url') . '/payment/failed?cancelled=1');
    }

    private function markPaymentFailed(?string $tranId): void
    {
        if (!$tranId) {
            return;
        }

        $order = Order::where('tran_id', $tranId)->first();

        if ($order && $order->payment_status === 'pending') {
            $order->update(['payment_status' => 'failed']);
        }
    }

    public function ipnListener(Request $request): Response
    {
        if ($request->input('status') !== 'VALID') {
            return response('OK', 200);
        }

        $order = Order::where('tran_id', $request->input('tran_id'))->first();

        if ($order && $order->payment_status !== 'paid') {
            $this->validateAndMarkPaid($order, $request->input('val_id'));
        }

        return response('OK', 200);
    }

    private function callbackUrl(string $path): string
    {
        if (config('sslcommerz.sandbox')) {
            $tunnelUrl = Tunnel::currentUrl();

            if ($tunnelUrl) {
                return $tunnelUrl . $path;
            }
        }

        return url($path);
    }

    private function validateAndMarkPaid(Order $order, ?string $valId): void
    {
        if (!$valId) {
            return;
        }

        try {
            $verification = Http::connectTimeout(5)->timeout(15)->get(config('sslcommerz.validator_url'), [
                'val_id' => $valId,
                'store_id' => config('sslcommerz.store_id'),
                'store_passwd' => config('sslcommerz.store_password'),
                'format' => 'json',
            ]);
        } catch (ConnectionException $e) {
            Log::warning('SSLCommerz validation timeout', [
                'order_id' => $order->id,
                'val_id' => $valId,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        $data = $verification->json();

        if (($data['status'] ?? '') === 'VALIDATED' && abs((float) ($data['amount'] ?? 0) - (float) $order->total) <= 0.01) {
            $order->update([
                'payment_status' => 'paid',
                'val_id' => $valId,
            ]);
        }
    }
}