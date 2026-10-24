<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\Admin\Contact\ContactController;
use App\Http\Controllers\Web\Admin\Dashboard\DashboardController;
use App\Http\Controllers\Web\Admin\User\UserController;
use App\Http\Controllers\Web\Admin\Faq\FaqController;
use App\Http\Controllers\Web\Admin\DynamicPage\DynamicPageController;
use App\Http\Controllers\Web\Admin\Notification\NotificationController;
use App\Http\Controllers\Web\Admin\Newsletter\NewsletterController;
use App\Http\Controllers\Web\Admin\JewelryCard\JewelryCardController;
use App\Http\Controllers\Web\Admin\CompanyInformation\CompanyInformationController;
use App\Http\Controllers\Web\Admin\Review\ReviewController;
use App\Http\Controllers\Web\Admin\Gem\GemTypeController;
use App\Http\Controllers\Web\Admin\Gem\GemColorController;
use App\Http\Controllers\Web\Admin\Gem\GemShapeController;
use App\Http\Controllers\Web\Admin\Gem\GemRequestController;

Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::get('/notification', [NotificationController::class, 'index'])->name('notification.index');
Route::patch('/notification/read-all', [NotificationController::class, 'markAllRead'])->name('notification.readAll');
Route::patch('/notification/{notification}/read', [NotificationController::class, 'markRead'])->name('notification.read');
Route::patch('/notification/{notification}/unread', [NotificationController::class, 'markUnread'])->name('notification.unread');
Route::patch('/notification/{notification}/resolved', [NotificationController::class, 'markResolved'])->name('notification.resolved');
Route::patch('/notification/{notification}/unresolved', [NotificationController::class, 'markUnresolved'])->name('notification.unresolved');


Route::get('/user/export-csv', [UserController::class, 'exportCsv'])->name('user.exportCsv');
Route::post('/user/bulk-destroy', [UserController::class, 'bulkDestroy'])->name('user.bulkDestroy');
Route::patch('/user/{user}/status', [UserController::class, 'updateStatus'])->name('user.updateStatus');
Route::delete('/user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
Route::resource('/user', UserController::class);

Route::patch('/dynamic_page/{dynamicPage}/status', [DynamicPageController::class, 'updateStatus'])->name('dynamic_page.updateStatus');
Route::resource('/dynamic_page', DynamicPageController::class);

Route::patch('/faq/{faq}/status', [FaqController::class, 'updateStatus'])->name('faq.updateStatus');
Route::resource('/faq', FaqController::class);

Route::resource('/contact', ContactController::class);

Route::resource('/newsletter', NewsletterController::class)->only(['index', 'destroy']);

Route::post('/jewelry_card/bulk-destroy', [JewelryCardController::class, 'bulkDestroy'])->name('jewelry_card.bulkDestroy');
Route::resource('/jewelry_card', JewelryCardController::class)->except(['show']);

Route::post('/review/bulk-destroy', [ReviewController::class, 'bulkDestroy'])->name('review.bulkDestroy');
Route::resource('/review', ReviewController::class)->only(['index', 'destroy']);

Route::patch('/company-information/{company_information}/status', [CompanyInformationController::class, 'updateStatus'])->name('company-information.updateStatus');
Route::post('/company-information/{company_information}/send-reminder', [CompanyInformationController::class, 'sendReminder'])->name('company-information.sendReminder');
Route::post('/company-information/bulk-destroy', [CompanyInformationController::class, 'bulkDestroy'])->name('company-information.bulkDestroy');
Route::resource('/company-information', CompanyInformationController::class)->only(['index', 'destroy']);

// Deal routes
Route::prefix('deal')->name('deal.')->group(function () {
    Route::patch('/product-category/{productCategory}/status', [\App\Http\Controllers\Web\Admin\Deal\ProductCategoryController::class, 'updateStatus'])->name('product-category.updateStatus');
    Route::resource('/product-category', \App\Http\Controllers\Web\Admin\Deal\ProductCategoryController::class)->parameters([
        'product-category' => 'productCategory',
    ]);

    Route::patch('/product/{product}/status', [\App\Http\Controllers\Web\Admin\Deal\DealProductController::class, 'updateStatus'])->name('product.updateStatus');
    Route::post('/product/bulk-destroy', [\App\Http\Controllers\Web\Admin\Deal\DealProductController::class, 'bulkDestroy'])->name('product.bulkDestroy');
    Route::resource('/product', \App\Http\Controllers\Web\Admin\Deal\DealProductController::class)->only(['index', 'show', 'destroy']);
});

// Gem Options routes
Route::prefix('gem')->name('gem.')->group(function () {
    // Requests
    Route::patch('/requests/{gemRequest}/status', [GemRequestController::class, 'updateStatus'])->name('requests.updateStatus');
    Route::post('/requests/bulk-destroy', [GemRequestController::class, 'bulkDestroy'])->name('requests.bulkDestroy');
    Route::resource('/requests', GemRequestController::class)->names('requests')->parameters(['requests' => 'gemRequest'])->only(['index', 'show', 'destroy']);

    // Types
    Route::patch('/types/{gemType}/status', [GemTypeController::class, 'updateStatus'])->name('types.updateStatus');
    Route::post('/types/bulk-destroy', [GemTypeController::class, 'bulkDestroy'])->name('types.bulkDestroy');
    Route::post('/types/bulk-store', [GemTypeController::class, 'bulkStore'])->name('types.bulkStore');
    Route::resource('/types', GemTypeController::class)->names('types')->parameters(['types' => 'gemType']);

    // Colors
    Route::patch('/colors/{gemColor}/status', [GemColorController::class, 'updateStatus'])->name('colors.updateStatus');
    Route::post('/colors/bulk-destroy', [GemColorController::class, 'bulkDestroy'])->name('colors.bulkDestroy');
    Route::post('/colors/bulk-store', [GemColorController::class, 'bulkStore'])->name('colors.bulkStore');
    Route::resource('/colors', GemColorController::class)->names('colors')->parameters(['colors' => 'gemColor']);

    // Shapes
    Route::patch('/shapes/{gemShape}/status', [GemShapeController::class, 'updateStatus'])->name('shapes.updateStatus');
    Route::post('/shapes/bulk-destroy', [GemShapeController::class, 'bulkDestroy'])->name('shapes.bulkDestroy');
    Route::post('/shapes/bulk-store', [GemShapeController::class, 'bulkStore'])->name('shapes.bulkStore');
    Route::resource('/shapes', GemShapeController::class)->names('shapes')->parameters(['shapes' => 'gemShape']);
});


