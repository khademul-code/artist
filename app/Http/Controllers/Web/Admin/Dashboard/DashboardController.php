<?php

namespace App\Http\Controllers\Web\Admin\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CompanyInformation;
use App\Models\Contact;
use App\Models\JewelryCard;
use App\Models\Newsletter;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'total_users'            => User::where('role', 'User')->count(),
                'total_contacts'         => Contact::count(),
                'total_newsletters'      => Newsletter::count(),
                'total_jewelry_cards'    => JewelryCard::count(),
                'total_company_infos'    => CompanyInformation::count(),
                'total_reviews'          => Review::count(),
            ],
        ]);
    }
}
