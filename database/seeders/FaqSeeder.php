<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            // FAQs for Both
            [
                'question' => 'What is JBA and how does the platform work?',
                'answer'   => '<p>JBA is a premier B2B and B2C jewelry networking platform connecting jewelry buyers, retailers, wholesalers, and verified suppliers. We facilitate direct connections, trade show networking, and showcase verified company portfolios.</p>',
                'type'     => 'both',
                'status'   => 'active',
            ],
            [
                'question' => 'How do I create and manage my account?',
                'answer'   => '<p>You can sign up by clicking the <strong>Register</strong> button at the top of the page. Once registered, complete your profile verification to access all buyer or supplier features tailored to your business needs.</p>',
                'type'     => 'both',
                'status'   => 'active',
            ],
            [
                'question' => 'How does JBA keep user data safe and secure?',
                'answer'   => '<p>We take security very seriously. All sensitive information and communications are encrypted using modern industry standards. We never share your personal information with unauthorized third parties.</p>',
                'type'     => 'both',
                'status'   => 'active',
            ],

            // FAQs for Buyers
            [
                'question' => 'How can I discover verified jewelry suppliers and wholesalers?',
                'answer'   => '<p>Browse our directory of verified jewelry cards filtered by company type (wholesaler, manufacturer, retailer, designer), product categories, or upcoming trade shows to connect directly with suppliers.</p>',
                'type'     => 'buyer',
                'status'   => 'active',
            ],
            [
                'question' => 'Can I request quotes or contact suppliers directly?',
                'answer'   => '<p>Yes! Every verified supplier profile includes contact options, mini-site links, phone, email, and booth numbers for trade shows so you can directly inquire about pricing and catalogs.</p>',
                'type'     => 'buyer',
                'status'   => 'active',
            ],
            [
                'question' => 'How do reviews and ratings work on jewelry profiles?',
                'answer'   => '<p>Registered buyers can submit honest reviews and star ratings on jewelry supplier profiles based on their business experiences, helping the community identify reputable partners.</p>',
                'type'     => 'buyer',
                'status'   => 'active',
            ],

            // FAQs for Suppliers
            [
                'question' => 'How can I list my jewelry business and booth details?',
                'answer'   => '<p>As a supplier, navigate to your dashboard and create a <strong>Jewelry Card</strong>. You can upload high-resolution images, provide company bio, select your business categories, and list your upcoming trade show booth numbers.</p>',
                'type'     => 'supplier',
                'status'   => 'active',
            ],
            [
                'question' => 'What are the requirements to become a verified supplier on Artistchi?',
                'answer'   => '<p>Suppliers must submit valid business information, contact details, and company verification documents. Our review team verifies all listings before publishing them to the marketplace.</p>',
                'type'     => 'supplier',
                'status'   => 'active',
            ],
            [
                'question' => 'How can I update my trade show participation schedule?',
                'answer'   => '<p>You can update your trade shows and booth numbers at any time from your account dashboard under Jewelry Cards so visiting buyers know exactly where to locate you at industry events.</p>',
                'type'     => 'supplier',
                'status'   => 'active',
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                [
                    'answer' => $faq['answer'],
                    'type'   => $faq['type'],
                    'status' => $faq['status'],
                ]
            );
        }
    }
}
