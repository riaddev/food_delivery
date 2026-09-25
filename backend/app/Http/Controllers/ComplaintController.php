<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AdminNotification;
use App\Models\Complaint;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ComplaintController extends Controller
{
    /**
     * Customer: file a complaint about one of their own delivered orders.
     * One open complaint per order. Multipart form (photos optional).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'type' => 'required|string|in:' . implode(',', Complaint::TYPES),
            'description' => 'required|string|min:10|max:2000',
            'photos' => 'nullable|array|max:' . Complaint::MAX_PHOTOS,
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:' . Complaint::MAX_PHOTO_KB,
        ]);

        $complaint = DB::transaction(function () use ($request, $validated) {
            $order = Order::whereKey($validated['order_id'])->lockForUpdate()->firstOrFail();

            if ((int) $order->user_id !== (int) $request->user()->id) {
                throw ValidationException::withMessages([
                    'order_id' => ['You can only report your own orders.'],
                ]);
            }

            if (!in_array($order->status, ['delivered', 'served'], true)) {
                throw ValidationException::withMessages([
                    'order_id' => ['Only delivered orders can be reported.'],
                ]);
            }

            $openExists = Complaint::where('order_id', $order->id)
                ->whereIn('status', ['open', 'investigating'])
                ->exists();

            if ($openExists) {
                throw ValidationException::withMessages([
                    'order_id' => ['This order already has an open report.'],
                ]);
            }

            $paths = [];
            foreach ($request->file('photos', []) as $photo) {
                $paths[] = $photo->store('complaint-evidence', 'public');
            }

            $created = Complaint::create([
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'description' => $validated['description'],
                'photos' => $paths,
                'status' => 'open',
            ]);

            AdminNotification::create([
                'type' => 'complaint_filed',
                'title' => 'New customer complaint',
                'description' => "Order #{$order->id} reported ({$validated['type']}).",
                'link_type' => 'complaints',
                'link_id' => $created->id,
            ]);

            return $created;
        });

        return response()->json([
            'complaint' => $complaint->fresh()->append('photo_urls'),
            'message' => 'Report submitted. Our team will review it shortly.',
        ], 201);
    }

    /**
     * Customer: list their own complaints (latest first).
     */
    public function mine(Request $request): JsonResponse
    {
        $complaints = Complaint::where('user_id', $request->user()->id)
            ->with(['order:id,restaurant_id,status,total'])
            ->latest()
            ->limit(100)
            ->get()
            ->each->append('photo_urls');

        return response()->json(['complaints' => $complaints]);
    }

    /**
     * Admin: queue with status filter + pagination (orders-list convention).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:' . implode(',', Complaint::STATUSES),
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = Complaint::with(['user:id,name,email,phone', 'order:id,restaurant_id,status,total,payment_method,payment_status'])
            ->latest();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $perPage = $validated['per_page'] ?? 20;
        $paginated = $query->paginate($perPage);

        $paginated->getCollection()->transform(function (Complaint $c) {
            $c->append('photo_urls');

            return [
                'id' => $c->id,
                'type' => $c->type,
                'status' => $c->status,
                'description' => $c->description,
                'photos' => $c->photo_urls,
                'resolution' => $c->resolution,
                'created_at' => $c->created_at,
                'customer' => $c->user ? [
                    'id' => $c->user->id,
                    'name' => $c->user->name,
                    'email' => $c->user->email,
                    'phone' => $c->user->phone,
                ] : null,
                'order' => $c->order ? [
                    'id' => $c->order->id,
                    'status' => $c->order->status,
                    'total' => $c->order->total,
                    'payment_method' => $c->order->payment_method,
                    'payment_status' => $c->order->payment_status,
                ] : null,
            ];
        });

        return response()->json([
            'complaints' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Admin: full detail — complaint + order graph + GPS trail + evidence.
     */
    public function show($id): JsonResponse
    {
        $complaint = Complaint::with([
            'user:id,name,email,phone',
            'admin:id,name',
            'order.user:id,name,email,phone',
            'order.restaurant:id,restaurant_name,address,phone',
            'order.items',
            'order.rider.user:id,name',
            'order.statusHistories',
        ])->findOrFail($id);

        $gpsTrail = $complaint->order
            ? $complaint->order->riderLocations()->latest()->limit(200)->get()
            : collect();

        $complaint->append('photo_urls');

        return response()->json([
            'complaint' => $complaint,
            'gps_trail' => $gpsTrail,
        ]);
    }

    /**
     * Admin: investigate / resolve / reject. Complaints never punish riders
     * or restaurants automatically — the admin decides. Paid orders can be
     * flagged for the existing manual refund flow; COD orders have nothing
     * to refund, so flag_refund is rejected for them.
     */
    public function resolve(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:investigating,resolved,rejected',
            'resolution' => 'required_if:status,resolved|nullable|string|max:2000',
            'admin_note' => 'nullable|string|max:2000',
            'flag_refund' => 'sometimes|boolean',
        ]);

        $complaint = DB::transaction(function () use ($request, $id, $validated) {
            $locked = Complaint::whereKey($id)->lockForUpdate()->firstOrFail();

            if (in_array($locked->status, ['resolved', 'rejected'], true)) {
                throw ValidationException::withMessages([
                    'status' => ['This complaint has already been closed.'],
                ]);
            }

            $locked->update([
                'status' => $validated['status'],
                'resolution' => $validated['resolution'] ?? $locked->resolution,
                'admin_note' => $validated['admin_note'] ?? $locked->admin_note,
                'admin_id' => $request->user()->id,
            ]);

            if (!empty($validated['flag_refund'])) {
                $order = Order::whereKey($locked->order_id)->lockForUpdate()->firstOrFail();

                if (($order->payment_method ?? null) === 'cash') {
                    throw ValidationException::withMessages([
                        'flag_refund' => ['COD orders have no collected payment to refund.'],
                    ]);
                }

                if (($order->payment_status ?? null) !== 'paid') {
                    throw ValidationException::withMessages([
                        'flag_refund' => ['Only paid orders can be flagged for refund.'],
                    ]);
                }

                $order->update(['payment_status' => 'refund_pending']);
            }

            ActivityLog::create([
                'type' => 'complaint_' . $validated['status'],
                'description' => "Complaint #{$locked->id} (order #{$locked->order_id}) marked as {$validated['status']}.",
            ]);

            AdminNotification::create([
                'type' => 'complaint_' . $validated['status'],
                'title' => "Complaint #{$locked->id} {$validated['status']}",
                'description' => "Order #{$locked->order_id} complaint {$validated['status']}.",
                'link_type' => 'complaints',
                'link_id' => $locked->id,
            ]);

            return $locked->fresh();
        });

        return response()->json([
            'complaint' => $complaint,
            'message' => "Complaint marked as {$validated['status']}.",
        ]);
    }
}
