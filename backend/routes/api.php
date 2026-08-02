<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\RestaurantController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register/customer', [AuthController::class, 'registerCustomer']);
Route::post('/register/restaurant', [AuthController::class, 'registerRestaurant']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/restaurants', [RestaurantController::class, 'publicList']);
Route::get('/restaurants/{id}', [RestaurantController::class, 'publicShow']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        if ($user->isRestaurant()) {
            $user->load('restaurant');
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
        Route::post('/orders/{id}/reorder', [CustomerController::class, 'reorder']);
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
        Route::get('/menu-items', [RestaurantController::class, 'menuItems']);
        Route::post('/menu-items', [RestaurantController::class, 'createMenuItem']);
        Route::put('/menu-items/{id}', [RestaurantController::class, 'updateMenuItem']);
        Route::delete('/menu-items/{id}', [RestaurantController::class, 'deleteMenuItem']);
    });

    Route::middleware('role:admin')->prefix('/admin')->group(function () {
        Route::get('/overview', [App\Http\Controllers\AdminController::class, 'overview']);
        Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
        Route::put('/users/{id}/role', [App\Http\Controllers\AdminController::class, 'updateUserRole']);
        Route::get('/restaurants', [App\Http\Controllers\AdminController::class, 'restaurants']);
        Route::put('/restaurants/{id}/status', [App\Http\Controllers\AdminController::class, 'updateRestaurantStatus']);
        Route::get('/orders', [App\Http\Controllers\AdminController::class, 'orders']);
        Route::put('/orders/{id}/status', [App\Http\Controllers\AdminController::class, 'updateOrderStatus']);
    });
});
