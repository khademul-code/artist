<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@admin.com',
                'password' => '12345678',
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'John Doe',
                'email' => 'buyer@gmail.com',
                'password' => '12345678',
                'role' => 'buyer',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'supplier@gmail.com',
                'password' => '12345678',
                'role' => 'supplier',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($data as $user) {
            User::create([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => Hash::make($user['password']),
                'role' => $user['role'],
                'email_verified_at' => $user['email_verified_at'],
            ]);
        }
    }
}
