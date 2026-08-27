<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\SslCommerzController;
use App\Http\Controllers\TrackingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register/customer', [AuthController::class, 'registerCustomer']);
Route::post('/apply/restaurant', [AuthController::class, 'applyRestaurant']);
Route::post('/apply/rider', [AuthController::class, 'applyRider']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/payment/success', [SslCommerzController::class, 'paymentSuccess']);
Route::post('/payment/fail', [SslCommerzController::class, 'paymentFail']);
Route::post('/payment/cancel', [SslCommerzController::class, 'paymentCancel']);
Route::post('/payment/ipn', [SslCommerzController::class, 'ipnListener']);

Route::post('/owner/verify-otp', [AuthController::class, 'verifySetupOtp'])->middleware('throttle:5,1');
Route::post('/owner/resend-otp', [AuthController::class, 'resendSetupOtp'])->middleware('throttle:3,1');

Route::get('/restaurants', [RestaurantController::class, 'publicList']);
Route::get('/restaurants/{id}', [RestaurantController::class, 'publicShow']);
Route::get('/restaurants/{id}/reviews', [RestaurantController::class, 'publicReviews']);
Route::get('/categories', [RestaurantController::class, 'publicCategories']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::post('/chat', [ChatController::class, 'send'])->middleware('throttle:15,1');
Route::get('/track/{trackingCode}', [TrackingController::class, 'track']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/owner/set-password', [AuthController::class, 'setSetupPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        if ($user->isRestaurant()) {
            $user->load('restaurant');
        }
        if ($user->isRider()) {
            $user->load('rider');
        }
        return $user;
    });

    Route::middleware('role:customer')->prefix('/customer')->group(function () {
        Route::get('/dashboard', function (Request $request) {
            return response()->json([
                'user' => $request->user(),
                'message' => 'Welcome to your customer dashboard!',
            ]);
        });

        Route::get('/overview', [CustomerController::class, 'dashboardOverview']);
        Route::put('/profile', [CustomerController::class, 'updateProfile']);
        Route::put('/change-password', [CustomerController::class, 'changePassword']);
        Route::get('/orders', [CustomerController::class, 'orders']);
        Route::get('/orders/{id}', [CustomerController::class, 'orderShow']);
        Route::post('/orders', [CustomerController::class, 'placeOrder']);
        Route::post('/orders/{id}/cancel', [CustomerController::class, 'cancelOrder']);
        Route::post('/orders/{id}/reorder', [CustomerController::class, 'reorder']);
        Route::post('/payment/initiate', [SslCommerzController::class, 'initiatePayment']);
        Route::get('/reservations', [ReservationController::class, 'customerIndex']);
        Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
        Route::post('/reviews', [CustomerController::class, 'storeReview']);
        Route::get('/favorites', [CustomerController::class, 'favorites']);
        Route::post('/favorites', [CustomerController::class, 'addFavorite']);
        Route::delete('/favorites/{restaurantId}', [CustomerController::class, 'removeFavorite']);
        Route::get('/wishlist-items', [CustomerController::class, 'wishlistItems']);
        Route::post('/wishlist-items', [CustomerController::class, 'addWishlistItem']);
        Route::delete('/wishlist-items/{menuItemId}', [CustomerController::class, 'removeWishlistItem']);
        Route::get('/addresses', [CustomerController::class, 'addresses']);
        Route::post('/addresses', [CustomerController::class, 'storeAddress']);
        Route::put('/addresses/{id}', [CustomerController::class, 'updateAddress']);
        Route::delete('/addresses/{id}', [CustomerController::class, 'deleteAddress']);
        Route::patch('/addresses/{id}/default', [CustomerController::class, 'setDefaultAddress']);
    });

    Route::middleware('role:restaurant')->prefix('/restaurant')->group(function () {
        Route::get('/dashboard', function (Request $request) {
            $user = $request->user()->load('restaurant.menuItems');
            return response()->json([
                'restaurant' => $user->restaurant,
                'message' => 'Welcome to your restaurant dashboard!',
            ]);
        });

        Route::put('/profile', [RestaurantController::class, 'updateProfile']);
        Route::get('/orders', [RestaurantController::class, 'orders']);
        Route::put('/orders/{id}/status', [RestaurantController::class, 'updateOrderStatus']);
        Route::get('/riders', [RestaurantController::class, 'availableRiders']);
        Route::post('/orders/{id}/assign-rider', [RestaurantController::class, 'assignRider']);
        Route::get('/reservations', [ReservationController::class, 'restaurantIndex']);
        Route::put('/reservations/{id}/status', [ReservationController::class, 'updateStatus']);
        Route::put('/reservations/{id}/table', [ReservationController::class, 'assignTable']);
        Route::get('/tables', [RestaurantController::class, 'tables']);
        Route::post('/tables', [RestaurantController::class, 'createTable']);
        Route::put('/tables/{id}', [RestaurantController::class, 'updateTable']);
        Route::put('/tables/{id}/status', [RestaurantController::class, 'updateTableStatus']);
        Route::get('/menu-items', [RestaurantController::class, 'menuItems']);
        Route::post('/menu-items', [RestaurantController::class, 'createMenuItem']);
        Route::put('/menu-items/{id}', [RestaurantController::class, 'updateMenuItem']);
        Route::delete('/menu-items/{id}', [RestaurantController::class, 'deleteMenuItem']);
    });

    Route::middleware('role:rider')->prefix('/rider')->group(function () {
        Route::put('/availability', [RiderController::class, 'setAvailability']);
        Route::get('/orders', [RiderController::class, 'orders']);
        Route::post('/orders/{id}/accept', [RiderController::class, 'acceptOrder']);
        Route::put('/orders/{id}/status', [RiderController::class, 'updateStatus']);
    });

    Route::middleware('role:admin')->prefix('/admin')->group(function () {
        Route::get('/overview', [App\Http\Controllers\AdminController::class, 'overview']);
        Route::get('/stats', [App\Http\Controllers\AdminController::class, 'stats']);
        Route::get('/activity-log', [App\Http\Controllers\AdminController::class, 'activityLog']);
        Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
        Route::put('/users/{id}/role', [App\Http\Controllers\AdminController::class, 'updateUserRole']);
        Route::get('/restaurants', [App\Http\Controllers\AdminController::class, 'restaurants']);
        Route::get('/restaurants/pending', [App\Http\Controllers\AdminController::class, 'pendingRestaurants']);
        Route::post('/restaurants/{id}/approve', [App\Http\Controllers\AdminController::class, 'approve']);
        Route::post('/restaurants/{id}/reject', [App\Http\Controllers\AdminController::class, 'reject']);
        Route::put('/restaurants/{id}/status', [App\Http\Controllers\AdminController::class, 'updateRestaurantStatus']);
        Route::get('/restaurants/{id}', [App\Http\Controllers\AdminController::class, 'restaurantDetail']);
        Route::post('/restaurants/{id}/suspend', [App\Http\Controllers\AdminController::class, 'suspendRestaurant']);
        Route::post('/restaurants/{id}/activate', [App\Http\Controllers\AdminController::class, 'activateRestaurant']);
        Route::get('/riders', [App\Http\Controllers\AdminController::class, 'riders']);
        Route::get('/riders/pending', [App\Http\Controllers\AdminController::class, 'pendingRiders']);
        Route::post('/riders/{id}/approve', [App\Http\Controllers\AdminController::class, 'approveRider']);
        Route::post('/riders/{id}/reject', [App\Http\Controllers\AdminController::class, 'rejectRider']);
        Route::get('/riders/{id}', [App\Http\Controllers\AdminController::class, 'riderDetail']);
        Route::post('/riders/{id}/suspend', [App\Http\Controllers\AdminController::class, 'suspendRider']);
        Route::post('/riders/{id}/activate', [App\Http\Controllers\AdminController::class, 'activateRider']);
        Route::get('/orders', [App\Http\Controllers\AdminController::class, 'orders']);
        Route::get('/orders/{id}', [App\Http\Controllers\AdminController::class, 'orderDetail']);
        Route::put('/orders/{id}/status', [App\Http\Controllers\AdminController::class, 'updateOrderStatus']);
        Route::post('/orders/{id}/assign-rider', [App\Http\Controllers\AdminController::class, 'assignRider']);
        Route::get('/customers', [App\Http\Controllers\AdminController::class, 'customers']);
        Route::get('/customers/{id}', [App\Http\Controllers\AdminController::class, 'customerDetail']);
        Route::post('/customers/{id}/suspend', [App\Http\Controllers\AdminController::class, 'suspendCustomer']);
        Route::post('/customers/{id}/activate', [App\Http\Controllers\AdminController::class, 'activateCustomer']);
        Route::get('/payments', [App\Http\Controllers\AdminController::class, 'payments']);
        Route::get('/analytics', [App\Http\Controllers\AdminController::class, 'analytics']);
        Route::get('/notifications', [App\Http\Controllers\AdminController::class, 'notifications']);
        Route::post('/notifications/read-all', [App\Http\Controllers\AdminController::class, 'markAllNotificationsRead']);
        Route::post('/notifications/{id}/read', [App\Http\Controllers\AdminController::class, 'markNotificationRead']);
        Route::get('/settings', [App\Http\Controllers\AdminController::class, 'settings']);
        Route::put('/settings/platform', [App\Http\Controllers\AdminController::class, 'updatePlatformSettings']);
        Route::put('/profile', [App\Http\Controllers\AdminController::class, 'adminProfile']);
        Route::put('/change-password', [App\Http\Controllers\AdminController::class, 'adminChangePassword']);
        Route::get('/promo-codes', [App\Http\Controllers\PromoCodeController::class, 'index']);
        Route::post('/promo-codes', [App\Http\Controllers\PromoCodeController::class, 'store']);
        Route::put('/promo-codes/{id}', [App\Http\Controllers\PromoCodeController::class, 'update']);
        Route::post('/promo-codes/{id}/toggle', [App\Http\Controllers\PromoCodeController::class, 'toggle']);
        Route::delete('/promo-codes/{id}', [App\Http\Controllers\PromoCodeController::class, 'destroy']);
        Route::get('/categories', [App\Http\Controllers\AdminController::class, 'categories']);
        Route::post('/categories', [App\Http\Controllers\AdminController::class, 'storeCategory']);
        Route::put('/categories/reorder', [App\Http\Controllers\AdminController::class, 'reorderCategories']);
        Route::put('/categories/{id}', [App\Http\Controllers\AdminController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [App\Http\Controllers\AdminController::class, 'deleteCategory']);
    });
});
