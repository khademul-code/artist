<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'https://jewelry-board-america.netlify.app',
        'https://jewelryboardofamerica.com',
        'https://jbamerica.net'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Changed to true for JWT
];
