<?php

namespace Database\Seeders;


use App\Models\DynamicPage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DynamicPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            [
                'page_title' => 'Terms of Service',
                'page_slug' => 'terms-of-service',
                'page_content' => '<h1>Terms of Service</h1><p>Terms of Service</p>',
            ],
            [
                'page_title' => 'Privacy Policy',
                'page_slug' => 'privacy-policy',
                'page_content' => '<h1>Privacy Policy</h1><p>Privacy Policy</p>',
            ],
        ];

        foreach ($pages as $page) {
            DynamicPage::create([
                'page_title' => $page['page_title'],
                'page_slug' => $page['page_slug'],
                'page_content' => $page['page_content'],
            ]);
        }
    }
}
