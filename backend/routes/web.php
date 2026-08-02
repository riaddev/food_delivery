<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

Route::get('/products', [App\Http\Controllers\ProductController::class, 'product'])->name('product');

Route::post('/products/add', [App\Http\Controllers\ProductController::class, 'addproduct'])->name('product.add');
