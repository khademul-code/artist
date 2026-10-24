<?php

namespace App\Http\Controllers\API\Deal;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\DealPaymentService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    use ApiResponse;

    protected DealPaymentService $dealPaymentService;

    public function __construct(DealPaymentService $dealPaymentService)
    {
        $this->dealPaymentService = $dealPaymentService;
    }

    /**
     * Store a newly created product (deal).
     * 1 deal per day is free. Extra deals require $5 payment.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }
        
        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        // Check supplier daily quota
        $quota = $this->dealPaymentService->checkSupplierDailyQuota($user);
        $requiresPayment = $quota['requires_payment'];

        // If payment required, verify Stripe configuration
        if ($requiresPayment && empty(config('services.stripe.secret'))) {
            return $this->error(
                'Stripe is not configured. Please set STRIPE_SECRET in your server environment.',
                500
            );
        }

        $uploadedImages = [];

        try {
            DB::beginTransaction();

            $data = $request->validated();

            if ($requiresPayment) {
                $data['status'] = 'pending_payment';
                $data['payment_status'] = 'unpaid';
                $data['payment_fee'] = $quota['deal_fee'];
            } else {
                $data['status'] = $data['status'] ?? 'active';
                $data['payment_status'] = 'free';
                $data['payment_fee'] = 0.00;
            }

            // Set user_id from authenticated user
            $data['user_id'] = $user->id;

            // Handle Product Type and Category relation
            if (!empty($data['product_category_id'])) {
                $category = ProductCategory::find($data['product_category_id']);
                if ($category && empty($data['product_type'])) {
                    $data['product_type'] = $category->name;
                }
            } elseif (!empty($data['product_type'])) {
                $category = ProductCategory::where('name', $data['product_type'])
                    ->orWhere('id', $data['product_type'])
                    ->first();
                if ($category) {
                    $data['product_category_id'] = $category->id;
                    $data['product_type'] = $category->name;
                }
            }

            // Calculate expiration date based on deal_duration
            if (!empty($data['deal_duration'])) {
                $data['expires_at'] = $this->calculateExpirationDate($data['deal_duration']);
            }

            // Handle multiple product images upload
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    if ($image->isValid()) {
                        $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $image->getClientOriginalName());
                        $path = Helper::fileUpload($image, 'products', $filename);
                        if ($path) {
                            $uploadedImages[] = $path;
                        }
                    }
                }
            }

            // Support single image input as well if provided
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                if ($image->isValid()) {
                    $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $image->getClientOriginalName());
                    $path = Helper::fileUpload($image, 'products', $filename);
                    if ($path) {
                        $uploadedImages[] = $path;
                    }
                }
            }

            $data['images'] = $uploadedImages;

            // Handle product_information key-value pairs
            if (isset($data['product_information']) && is_array($data['product_information'])) {
                // Filter out empty rows where both topic and information are blank
                $filteredInfo = array_values(array_filter($data['product_information'], function ($item) {
                    if (!is_array($item)) return false;
                    return !empty(trim($item['topic'] ?? '')) || !empty(trim($item['information'] ?? ''));
                }));
                $data['product_information'] = $filteredInfo;
            }

            $data['slug'] = Str::slug($data['name']);

            // Ensure unique slug if exists
            $originalSlug = $data['slug'];
            $count = 1;
            while (Product::where('slug', $data['slug'])->exists()) {
                $data['slug'] = "{$originalSlug}-" . $count++;
            }

            $product = Product::create($data);

            $successUrl = config('app.frontend_url') . '/deal/payment/success';
            $cancelUrl = config('app.frontend_url') . '/deal/payment/cancel';

            if ($requiresPayment) {
                $session = $this->dealPaymentService->createCheckoutSession(
                    $user,
                    $product,
                    $successUrl,
                    $cancelUrl
                );

                DB::commit();

                $product->load(['category', 'user']);

                return $this->success(
                    'Daily free deal limit reached. Please complete payment of $' . number_format($quota['deal_fee'], 2) . ' to activate your deal.',
                    [
                        'payment_required' => true,
                        'deal_fee'         => $quota['deal_fee'],
                        'currency'         => 'usd',
                        'checkout_url'     => $session->url,
                        'session_id'       => $session->id,
                        'product'          => new ProductResource($product),
                    ],
                    201
                );
            }

            DB::commit();

            $product->load(['category', 'user']);

            return $this->success(
                'Product deal posted successfully as your free deal of the day!',
                [
                    'payment_required' => false,
                    'product'          => new ProductResource($product),
                ],
                201
            );
        } catch (\Throwable $th) {
            DB::rollBack();

            foreach ($uploadedImages as $uploadedPath) {
                try {
                    Helper::fileDelete(public_path($uploadedPath));
                } catch (\Throwable $fe) {
                    // Ignore file delete failure during rollback
                }
            }

            Log::error('Error storing product deal: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString(),
            ]);

            return $this->error('Failed to store product: ' . $th->getMessage(), 500);
        }
    }

    /**
     * Update an existing product (deal).
     */
    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error(
                'You are not authorized to perform this action.',
                403
            );
        }

        $product = Product::where('id', $id)->orWhere('slug', $id)->first();

        if (!$product) {
            return $this->error('Product not found', 404);
        }

        if ($product->user_id !== $user->id) {
            return $this->error(
                'You are not authorized to update this product.',
                403
            );
        }

        $uploadedPaths = [];
        $filesToDelete = [];

        try {
            DB::beginTransaction();

            $data = $request->validated();

            if (!empty($data['product_category_id'])) {
                $category = ProductCategory::find(
                    $data['product_category_id']
                );

                if ($category && empty($data['product_type'])) {
                    $data['product_type'] = $category->name;
                }
            } elseif (!empty($data['product_type'])) {
                $category = ProductCategory::where('name', $data['product_type'])
                    ->orWhere('id', $data['product_type'])
                    ->first();

                if ($category) {
                    $data['product_category_id'] = $category->id;
                    $data['product_type'] = $category->name;
                }
            }

            if (array_key_exists('deal_duration', $data)) {
                $data['expires_at'] = !empty($data['deal_duration'])
                    ? $this->calculateExpirationDate(
                        $data['deal_duration']
                    )
                    : null;
            }

            $currentImages = $product->images ?? [];

            // Support JSON-cast or uncased JSON columns.
            if (is_string($currentImages)) {
                $currentImages = json_decode($currentImages, true) ?? [];
            }

            if (!is_array($currentImages)) {
                $currentImages = [];
            }

            $currentImages = array_values(
                array_filter($currentImages, 'is_string')
            );

            // Normalize URL/path to a relative path.
            $normalizeImagePath = function ($path) {
                if (!is_string($path)) {
                    return null;
                }

                $path = trim($path);

                if ($path === '') {
                    return null;
                }

                // Accept URLs from this application only.
                if (preg_match('#^https?://#i', $path)) {
                    $baseUrl = rtrim(url('/'), '/');

                    if (
                        $path !== $baseUrl &&
                        !str_starts_with($path, $baseUrl . '/')
                    ) {
                        return null;
                    }

                    $path = substr($path, strlen($baseUrl));
                }

                $path = ltrim($path, '/');

                // Prevent path traversal and invalid paths.
                if (
                    str_contains($path, '..') ||
                    str_contains($path, '\\') ||
                    str_starts_with($path, 'http://') ||
                    str_starts_with($path, 'https://')
                ) {
                    return null;
                }

                return $path;
            };

            /*
            |--------------------------------------------------------------------------
            | 1. Remove Selected Existing Images
            |--------------------------------------------------------------------------
            */

            $removeImages = $request->input(
                'remove_images',
                $request->input(
                    'remove_images',
                    []
                )
            );

            if (!is_array($removeImages)) {
                $removeImages = [];
            }

            foreach ($removeImages as $removeImage) {
                $relativePath = $normalizeImagePath($removeImage);

                if (
                    !$relativePath ||
                    !in_array($relativePath, $currentImages, true)
                ) {
                    continue;
                }

                // Only remove images already attached to this product.
                $currentImages = array_values(
                    array_filter(
                        $currentImages,
                        fn ($image) => $image !== $relativePath
                    )
                );

                $filesToDelete[] = $relativePath;
            }

            /*
            |--------------------------------------------------------------------------
            | 2. Upload New Images
            |--------------------------------------------------------------------------
            */

            $newImages = [];

            $imageFiles = [];

            if ($request->hasFile('images')) {
                $files = $request->file('images');

                $imageFiles = array_merge(
                    $imageFiles,
                    is_array($files) ? $files : [$files]
                );
            }

            // Backward compatibility with the old single-image field.
            if ($request->hasFile('image')) {
                $imageFiles[] = $request->file('image');
            }

            foreach ($imageFiles as $image) {
                if (!$image || !$image->isValid()) {
                    throw new \RuntimeException(
                        'One or more uploaded images are invalid.'
                    );
                }

                $filename = time() . '_' . uniqid() . '_' .
                    preg_replace(
                        '/[^A-Za-z0-9_.-]/',
                        '_',
                        $image->getClientOriginalName()
                    );

                $path = Helper::fileUpload(
                    $image,
                    'products',
                    $filename
                );

                if (!$path) {
                    throw new \RuntimeException(
                        'Failed to upload product image.'
                    );
                }

                $uploadedPaths[] = $path;
                $newImages[] = $path;
            }

            $currentImages = array_values(
                array_merge($currentImages, $newImages)
            );

            if (
                !$request->hasFile('images') &&
                !$request->hasFile('image') &&
                $request->exists('images') &&
                is_array($request->input('images'))
            ) {
                $providedImages = [];

                foreach ($request->input('images') as $image) {
                    $path = $normalizeImagePath($image);

                    if ($path) {
                        $providedImages[] = $path;
                    }
                }

                // Only allow paths that are already attached to this product.
                $providedImages = array_values(
                    array_unique(
                        array_filter(
                            $providedImages,
                            fn ($path) => in_array(
                                $path,
                                $product->images ?? [],
                                true
                            )
                        )
                    )
                );

                $filesToDelete = array_merge(
                    $filesToDelete,
                    array_diff($currentImages, $providedImages)
                );

                $currentImages = $providedImages;
            }

            // Update images only if image-related input was provided.
            $imagesChanged =
                $request->exists('remove_images') ||
                $request->hasFile('images') ||
                $request->hasFile('image') ||
                (
                    $request->exists('images') &&
                    is_array($request->input('images'))
                );

            if ($imagesChanged) {
                $data['images'] = $currentImages;
            }

            /*
            |--------------------------------------------------------------------------
            | 4. Clean Temporary Request Fields
            |--------------------------------------------------------------------------
            */

            unset(
                $data['remove_images'],
                $data['deleted_images'],
                $data['delete_images'],
                $data['existing_images'],
                $data['image']
            );

            /*
            |--------------------------------------------------------------------------
            | 5. Handle Product Information
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['product_information']) &&
                is_array($data['product_information'])
            ) {
                $data['product_information'] = array_values(
                    array_filter(
                        $data['product_information'],
                        function ($item) {
                            if (!is_array($item)) {
                                return false;
                            }

                            return
                                !empty(trim($item['topic'] ?? '')) ||
                                !empty(
                                    trim($item['information'] ?? '')
                                );
                        }
                    )
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 6. Update Slug When Product Name Changes
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['name']) &&
                $data['name'] !== $product->name
            ) {
                $baseSlug = Str::slug($data['name']);
                $slug = $baseSlug;

                while (
                    Product::where('slug', $slug)
                        ->where('id', '!=', $product->id)
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . Str::lower(
                        Str::random(5)
                    );
                }

                $data['slug'] = $slug;
            }

            $product->update($data);

            DB::commit();

            foreach (array_unique($filesToDelete) as $path) {
                try {
                    Helper::fileDelete(public_path($path));
                } catch (\Throwable $fileException) {
                    Log::warning(
                        'Failed to delete removed product image.',
                        [
                            'product_id' => $product->id,
                            'image' => $path,
                            'error' => $fileException->getMessage(),
                        ]
                    );
                }
            }

            $product->refresh();
            $product->load(['category', 'user']);

            return $this->success(
                'Product updated successfully!',
                new ProductResource($product),
                200
            );
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            foreach (array_unique($uploadedPaths) as $path) {
                try {
                    Helper::fileDelete(public_path($path));
                } catch (\Throwable $fileException) {
                    Log::warning(
                        'Failed to clean up uploaded product image.',
                        [
                            'image' => $path,
                            'error' => $fileException->getMessage(),
                        ]
                    );
                }
            }

            Log::error('Error updating product deal: ' . $th->getMessage(), [
                'product_id' => $id,
                'trace' => $th->getTraceAsString(),
            ]);

            return $this->error(
                'Failed to update product: ' . $th->getMessage(),
                500
            );
        }
    }

    /**
     * List user products / deals with filters (search, price range, category, sorting).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'user']);
        $query->where('status', 'active');

        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('product_type', 'like', "%{$searchTerm}%");
            });
        }

        $minPrice = $request->input('min_price');
        if ($minPrice !== null && $minPrice !== '') {
            $query->where('offer_price', '>=', (float) $minPrice);
        }

        $maxPrice = $request->input('max_price');
        if ($maxPrice !== null && $maxPrice !== '') {
            $query->where('offer_price', '<=', (float) $maxPrice);
        }

        $categoryInput = $request->input('category');
        $categoryList = [];
        
        if ($categoryInput) {
            if (is_array($categoryInput)) {
                $categoryList = $categoryInput;
            } elseif (is_string($categoryInput)) {
                if (str_starts_with(trim($categoryInput), '[') && str_ends_with(trim($categoryInput), ']')) {
                    $decoded = json_decode($categoryInput, true);
                    $categoryList = is_array($decoded) ? $decoded : [$categoryInput];
                } elseif (str_contains($categoryInput, ',')) {
                    $categoryList = array_map('trim', explode(',', $categoryInput));
                } else {
                    $categoryList = [trim($categoryInput)];
                }
            }

            $categoryList = array_values(array_filter($categoryList, fn($val) => $val !== '' && $val !== null));

            if (!empty($categoryList)) {
                $query->where(function ($q) use ($categoryList) {
                    $q->whereIn('product_type', $categoryList)
                      ->orWhereIn('product_category_id', $categoryList)
                      ->orWhereHas('category', function ($catQuery) use ($categoryList) {
                          $catQuery->whereIn('name', $categoryList)
                                   ->orWhereIn('id', $categoryList);
                      });
                });
            }
        }

        $sortBy = strtolower(trim((string) $request->input('sort_by', 'newest')));

        match ($sortBy) {
            'lowest_price' => $query->orderBy('offer_price', 'asc'),
            'highest_price' => $query->orderBy('offer_price', 'desc'),
            'limited_stock' => $query->orderBy('quantity', 'asc'),
            default => $query->latest(),
        };

        $products = $query->paginate($request->integer('per_page', 15))->withQueryString();

        return $this->pagination('Products retrieved successfully!', ProductResource::collection($products), $products);
    }

    /**
     * List supplier products / deals.
     */
    public function myProducts(Request $request): JsonResponse
    {
        $user = auth()->user();
            if (!$user) {
                return $this->error('User not found', 404);
            }

            if ($user->role !== 'supplier') {
                return $this->error('You are not authorized to perform this action.', 403);
            }

        $query = Product::with(['category', 'user'])->latest();

        $query->where('user_id', $user->id);


        $products = $query->paginate($request->integer('per_page', 15));

        return $this->pagination('Products retrieved successfully!', ProductResource::collection($products), $products);
    }

    /**
     * Hold products / deals.
     */
    public function holdProduct($id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $product = Product::where('id', $id)->first();

        if (!$product) {
            return $this->error('Product not found', 404);
        }

        if ($product->user_id !== $user->id) {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        if($product->status === 'active'){
            $product->status = 'inactive';
        }else{
            $product->status = 'active';
        }
        $product->save();

        return $this->success('Product status changed successfully', new ProductResource($product));
    }

    /**
     * Show my single product details.
     */
    public function myProductShow($id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $product = Product::with(['category', 'user'])->where('user_id', $user->id)->where('id', $id)->first();

        if (!$product) {
            return $this->error('Product not found', 404);
        }

        return $this->success('Product details retrieved successfully', new ProductResource($product));
    }

    /**
     * Delete single product.
     */
    public function delete($id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $product = Product::with(['category', 'user'])->where('user_id', $user->id)->where('id', $id)->first();

        if (!$product) {
            return $this->error('Product not found', 404);
        }

        // delete product images from file

        $images = $product->images;

        // Handle both array and JSON string values
        if (is_string($images)) {
            $images = json_decode($images, true);
        }

        if (is_array($images)) {
            foreach ($images as $image) {
                $path = public_path($image);

                if (is_file($path)) {
                    unlink($path);
                }
            }
        }

        $product->delete();

        return $this->success('Product deleted successfully', []);
    }

    /**
     * Show single product details.
     */
    public function show($slug): JsonResponse
    {
        $product = Product::with(['category', 'user'])->where('status', 'active')->where('slug', $slug)->first();

        if (!$product) {
            return $this->error('Product not found', 404);
        }

        $product->increment('view_count');

        // get related product
        $relatedProducts = Product::with(['category', 'user'])->where('status', 'active')->where('product_type', $product->product_type)->where('id', '!=', $product->id)->take(5)->get();

        return $this->success('Product details retrieved successfully', [
            'product' => new ProductResource($product),
            'relatedProducts' => ProductResource::collection($relatedProducts)
        ]);
    }

    /**
     * Get active product categories for dropdown.
     */
    public function categories(): JsonResponse
    {
        $categories = ProductCategory::where('status', 'active')->select('id', 'name')->get();

        return $this->success('Product categories retrieved successfully', $categories);
    }

    /**
     * Helper to compute expiration datetime from duration label.
     */
    private function calculateExpirationDate(string $duration): ?Carbon
    {
        $normalized = strtolower(trim($duration));

        return match (true) {
            str_contains($normalized, '24 hour') || str_contains($normalized, '1 day') => now()->addDay(),
            str_contains($normalized, '3 day') => now()->addDays(3),
            str_contains($normalized, '1 week') || str_contains($normalized, '7 day') => now()->addWeek(),
            str_contains($normalized, '1 month') || str_contains($normalized, '30 day') => now()->addMonth(),
            str_contains($normalized, 'until sold') => null,
            default => null,
        };
    }

    /**
     * Check current supplier's daily deal quota.
     * Returns whether the next deal is free or requires $5 payment.
     */
    public function checkLimit(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $quota = $this->dealPaymentService->checkSupplierDailyQuota($user);

        return $this->success('Daily deal limit status retrieved successfully', $quota);
    }

    /**
     * Verify Stripe Checkout Session and activate deal.
     */
    public function verifyPayment(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $sessionId = $request->input('session_id');
        if (empty($sessionId)) {
            return $this->error('The session_id field is required.', 422);
        }

        try {
            $product = $this->dealPaymentService->verifyAndActivateDeal($sessionId);

            if ($product->user_id !== $user->id) {
                return $this->error('You are not authorized to verify this payment.', 403);
            }

            $product->load(['category', 'user']);

            return $this->success('Deal payment confirmed and deal activated successfully!', [
                'product' => new ProductResource($product),
            ]);
        } catch (\Throwable $th) {
            Log::error('Deal payment verification error: ' . $th->getMessage(), [
                'session_id' => $sessionId,
                'user_id'    => $user->id,
            ]);

            return $this->error('Failed to verify deal payment: ' . $th->getMessage(), 400);
        }
    }

    /**
     * Create / retry a checkout session for an unpaid deal.
     */
    public function retryCheckout(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return $this->error('User not found', 404);
        }

        if ($user->role !== 'supplier') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $product = Product::where('id', $id)->where('user_id', $user->id)->first();
        if (!$product) {
            return $this->error('Product deal not found.', 404);
        }

        if ($product->payment_status === 'paid' || $product->payment_status === 'free') {
            return $this->error('This product deal is already active and does not require payment.', 400);
        }

        $successUrl = config('app.frontend_url') . '/deal/payment/success';
        $cancelUrl = config('app.frontend_url') . '/deal/payment/cancel';

        try {
            $session = $this->dealPaymentService->createCheckoutSession(
                $user,
                $product,
                $successUrl,
                $cancelUrl
            );

            return $this->success('Checkout session generated successfully.', [
                'checkout_url' => $session->url,
                'session_id'   => $session->id,
                'product'      => new ProductResource($product),
            ]);
        } catch (\Throwable $th) {
            return $this->error('Failed to generate checkout session: ' . $th->getMessage(), 500);
        }
    }
}

