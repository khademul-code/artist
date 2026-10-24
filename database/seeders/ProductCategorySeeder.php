<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Earrings',
            'Necklace',
            'Bracelet',
            'Bangle',
            'Stud',
            'Ring',
            'Chain',
        ];

        foreach ($categories as $category) {
            ProductCategory::updateOrCreate(
                ['name' => $category],
                ['status' => 'active']
            );
        }
    }
}
