<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SystemSetting::create([
            'title' => 'JBA',
            'system_name' => 'JBA',
            'email' => 'support@jbamerica.net',
            'number' => '+12129554582',
            'logo' => null,
            'favicon' => null,
            'address' => '123 Main St, Anytown, USA',
            'copyright_text' => 'Copyright 2026. All Rights Reserved. Powered by JBA.',
            'description' => 'JBA is a platform for jewelry businesses.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
