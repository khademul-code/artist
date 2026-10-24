<?php


use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
   return redirect('/login');
    // return Inertia::render('welcome');
})->name('home');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
