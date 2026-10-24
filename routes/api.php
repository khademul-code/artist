<?php

use App\Http\Controllers\API\Auth\LoginController;
use App\Http\Controllers\API\Auth\RegisterController;
use App\Http\Controllers\API\Auth\SocialLoginController;
use App\Http\Controllers\API\Contact\ContactController;
use App\Http\Controllers\API\Deal\ProductController;
use App\Http\Controllers\API\DynamicPage\DynamicPageController;
use App\Http\Controllers\API\Faq\FaqController;
use App\Http\Controllers\API\Gem\BuyerGemRequestController;
use App\Http\Controllers\API\Gem\GemOptionController;
use App\Http\Controllers\API\Gem\GemRequestController;
use App\Http\Controllers\API\Gem\SupplierGemProposalController;
use App\Http\Controllers\API\Jewelry\JewelryController;
use App\Http\Controllers\API\Message\MessageController;
use App\Http\Controllers\API\Newsletter\NewsletterController;
use App\Http\Controllers\API\Notification\NotificationController;
use App\Http\Controllers\API\SystemSetting\SystemSettingController;
use App\Http\Controllers\API\Track\TrackController;
use App\Http\Controllers\API\User\BuyerController;
use App\Http\Controllers\API\User\SupplierController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::middleware(['guest'])->group(function () {

    //  Authentication routes
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/verify_otp', [RegisterController::class, 'verify_otp']);
    Route::post('/resend_otp', [RegisterController::class, 'resend_otp']);
    Route::post('/forgot-password', [RegisterController::class, 'forgot_password']);
    Route::post('/forgot-verify-otp', [RegisterController::class, 'forgot_verify_otp']);
    Route::post('/reset-password', [RegisterController::class, 'reset_password']);
    Route::post('/social-login', [SocialLoginController::class, 'socialLogin']);
});


//dynamic page
Route::get('/terms-of-service', [DynamicPageController::class, 'termsOfService']);
Route::get('/privacy-policy', [DynamicPageController::class, 'privacyPolicy']);

//system settings
Route::get('/system-info', [SystemSettingController::class, 'systemInfo']);
Route::get('/social-links', [SystemSettingController::class, 'socialLinks']);

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe']);


// faq
Route::get('/faq/supplier', [FaqController::class, 'forSupplier']);
Route::get('/faq/buyer', [FaqController::class, 'forBuyer']);

// contact
Route::post('/contact', [ContactController::class, 'store']);

// jewelry cards
Route::get('/jewelry-cards', [JewelryController::class, 'jewelryCard']);
Route::get('/jewelry-cards/{id}', [JewelryController::class, 'jewelryCardDetail']);
Route::get('/jewelry-cards/reviews/{id}', [JewelryController::class, 'getReviews']);

// Deals & Products (Public)
Route::get('/deal/products', [ProductController::class, 'index']);
Route::get('/deal/products/{slug}', [ProductController::class, 'show']);
Route::get('/deal/product-categories', [ProductController::class, 'categories']);

// Gem Options (Public)
Route::get('/gems/options', [GemOptionController::class, 'options']);

// Gem Requests (Public)
Route::get('/gem-requests', [GemRequestController::class, 'index']);
Route::get('/gem-requests/{id}', [GemRequestController::class, 'show']);

Route::group(['middleware' => 'auth:sanctum'], function ($router) {
    // common routes
    Route::post('/logout', [LoginController::class, 'logout']);

    // Deal Products (Authenticated)
    Route::get('/deal/my-products', [ProductController::class, 'myProducts']);
    Route::get('/deal/my-product/{id}', [ProductController::class, 'myProductShow']);
    Route::get('/deal/check-limit', [ProductController::class, 'checkLimit']);
    Route::get('/deal/daily-quota', [ProductController::class, 'checkLimit']);
    Route::post('/deal/product/store', [ProductController::class, 'store']);
    Route::post('/deal/product/checkout/{id}', [ProductController::class, 'retryCheckout']);
    Route::post('/deal/payment/verify', [ProductController::class, 'verifyPayment']);
    Route::put('/deal/product/update/{id}', [ProductController::class, 'update']);
    Route::put('/deal/product/hold/{id}', [ProductController::class, 'holdProduct']);
    Route::delete('/deal/product/delete/{id}', [ProductController::class, 'delete']);

    // supplier profile routes
    Route::get('/supplier/profile', [SupplierController::class, 'supplierProfile']);
    Route::post('/supplier/profile/update', [SupplierController::class, 'updateProfile']);
    Route::post('/supplier/company/profile/create', [SupplierController::class, 'createCompanyProfile']);
    Route::post('/supplier/company/sendcontact/link', [SupplierController::class, 'sendContactLink']);
    Route::post('/supplier/change-password', [SupplierController::class, 'changePassword']);
    Route::post('/supplier/account-delete', [SupplierController::class, 'accountDelete']);

    // buyer profile routes
    Route::get('/buyer/profile', [BuyerController::class, 'buyerProfile']);
    Route::post('/buyer/profile/update', [BuyerController::class, 'updateProfile']);
    Route::post('/buyer/change-password', [BuyerController::class, 'changePassword']);
    Route::post('/buyer/account-delete', [BuyerController::class, 'accountDelete']);

    // supplier gem proposals
    Route::prefix('supplier')->middleware('role:supplier')->group(function () {
        Route::post('/gem-requests/{id}/proposals', [SupplierGemProposalController::class, 'store'])->middleware('throttle:30,1');
        Route::get('/gem-proposals', [SupplierGemProposalController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/gem-proposals/{id}', [SupplierGemProposalController::class, 'show'])->middleware('throttle:60,1');
    });

    // buyer gem requests
    Route::prefix('buyer/gem-requests')->middleware('role:buyer')->group(function () {
        Route::get('/', [BuyerGemRequestController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [BuyerGemRequestController::class, 'store'])->middleware('throttle:15,1');
        Route::get('/proposals/{id}', [BuyerGemRequestController::class, 'showProposal'])->middleware('throttle:60,1');
        Route::get('/{id}', [BuyerGemRequestController::class, 'show'])->middleware('throttle:60,1');
        Route::match(['put', 'post'], '/{id}/update', [BuyerGemRequestController::class, 'update'])->middleware('throttle:20,1');
        Route::post('/{id}/withdraw', [BuyerGemRequestController::class, 'withdraw'])->middleware('throttle:20,1');
        Route::get('/{id}/proposals', [BuyerGemRequestController::class, 'proposals'])->middleware('throttle:60,1');
    });

    //session
    Route::post('/session/start', [TrackController::class, 'start']);
    Route::post('/session/end', [TrackController::class, 'end']);

    //notification
    Route::get('/setting/notification', [NotificationController::class, 'index']);
    Route::post('/setting/notification/update', [NotificationController::class, 'update']);
    Route::get('/notifications', [NotificationController::class, 'userNotifications']);
    //firebase token
    Route::post('/firebase-token', [NotificationController::class, 'storeFirebaseToken']);

    Route::post('/jewelry-cards/review', [JewelryController::class, 'review']);

    // Message routes
    Route::get('/messages/unread-count', [MessageController::class, 'totalunread']);
    Route::get('/conversations', [MessageController::class, 'index']);
    Route::get('/conversations/{conversation}', [MessageController::class, 'show']);
    Route::post('/conversations', [MessageController::class, 'createConversation']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);
});
