<?php

namespace Database\Seeders;

use App\Models\GemColor;
use App\Models\GemShape;
use App\Models\GemType;
use Illuminate\Database\Seeder;

class GemOptionSeeder extends Seeder
{
    /**
     * Run the database seeds for Gem Options (Types, Shapes, Colors).
     */
    public function run(): void
    {
        $this->seedTypes();
        $this->seedShapes();
        $this->seedColors();
    }

    /**
     * Seed Gem Types
     */
    private function seedTypes(): void
    {
        $types = [
            'Pearl',
            'Diamonds',
            'Rubies',
            'Emeralds',
            'Sapphires',
            'Opals',
            'Amethysts',
            'Topaz',
            'Tourmaline',
            'Aquamarine',
            'Others',
        ];

        foreach ($types as $index => $name) {
            GemType::updateOrCreate(
                ['name' => $name],
                [
                    'sort_order' => $index + 1,
                    'status'     => 'active',
                ]
            );
        }
    }

    /**
     * Seed Gem Shapes
     */
    private function seedShapes(): void
    {
        $shapes = [
            'Round'      => 'storage/gem_shapes/Round.png',
            'Semi-Round' => 'storage/gem_shapes/Semi-Round.png',
            'Oval'       => 'storage/gem_shapes/Oval.png',
            'Button'     => 'storage/gem_shapes/Button.png',
            'Drop'       => 'storage/gem_shapes/Drop.png',
            'Pear'       => 'storage/gem_shapes/Pear.png',
            'Baroque'    => 'storage/gem_shapes/Baroque.png',
            'Baroqe'     => 'storage/gem_shapes/Baroqe.png',
            'Circle'     => 'storage/gem_shapes/Circle.png',
            'Cilrle'     => 'storage/gem_shapes/Cilrle.png',
            'PS-01'      => 'storage/gem_shapes/PS-01.png',
            'PS-02'      => 'storage/gem_shapes/PS-02.png',
            'PS-03'      => 'storage/gem_shapes/PS-03.png',
            'PS-04'      => 'storage/gem_shapes/PS-04.png',
            'PS-05'      => 'storage/gem_shapes/PS-05.png',
            'PS-06'      => 'storage/gem_shapes/PS-06.png',
            'PS-07'      => 'storage/gem_shapes/PS-07.png',
            'PS-08'      => 'storage/gem_shapes/PS-08.png',
            'PS-09'      => 'storage/gem_shapes/PS-09.png',
            'PS-10'      => 'storage/gem_shapes/PS-10.png',
            'PS-11'      => 'storage/gem_shapes/PS-11.png',
            'PS-20'      => 'storage/gem_shapes/PS-20.png',
            'PS-21'      => 'storage/gem_shapes/PS-21.png',
            'PS-22'      => 'storage/gem_shapes/PS-22.png',
            'PS-23'      => 'storage/gem_shapes/PS-23.png',
            'PS-24'      => 'storage/gem_shapes/PS-24.png',
            'PS-25'      => 'storage/gem_shapes/PS-25.png',
            'PS-40'      => 'storage/gem_shapes/PS-40.png',
            'PS-41'      => 'storage/gem_shapes/PS-41.png',
            'PS-42'      => 'storage/gem_shapes/PS-42.png',
            'PS-43'      => 'storage/gem_shapes/PS-43.png',
            'PS-44'      => 'storage/gem_shapes/PS-44.png',
            'PS-45'      => 'storage/gem_shapes/PS-45.png',
            'PS-46'      => 'storage/gem_shapes/PS-46.png',
            'PS-47'      => 'storage/gem_shapes/PS-47.png',
            'PS-48'      => 'storage/gem_shapes/PS-48.png',
            'PS-49'      => 'storage/gem_shapes/PS-49.png',
            'PS-50'      => 'storage/gem_shapes/PS-50.png',
            'PS-51'      => 'storage/gem_shapes/PS-51.png',
            'PS-60'      => 'storage/gem_shapes/PS-60.png',
            'PS-61'      => 'storage/gem_shapes/PS-61.png',
            'PS-62'      => 'storage/gem_shapes/PS-62.png',
            'PS-63'      => 'storage/gem_shapes/PS-63.png',
            'PS-64'      => 'storage/gem_shapes/PS-64.png',
            'PS-65'      => 'storage/gem_shapes/PS-65.png',
            'PS-66'      => 'storage/gem_shapes/PS-66.png',
            'PS-67'      => 'storage/gem_shapes/PS-67.png',
            'PS-80'      => 'storage/gem_shapes/PS-80.png',
            'PS-81'      => 'storage/gem_shapes/PS-81.png',
            'PS-82'      => 'storage/gem_shapes/PS-82.png',
            'PS-83'      => 'storage/gem_shapes/PS-83.png',
            'PS-84'      => 'storage/gem_shapes/PS-84.png',
            'PS-85'      => 'storage/gem_shapes/PS-85.png',
            'PS-86'      => 'storage/gem_shapes/PS-86.png',
            'PS-87'      => 'storage/gem_shapes/PS-87.png',
            'PS-97'      => 'storage/gem_shapes/PS-97.png',
        ];

        $order = 1;
        foreach ($shapes as $name => $image) {
            GemShape::updateOrCreate(
                ['name' => $name],
                [
                    'image'      => $image,
                    'sort_order' => $order++,
                    'status'     => 'active',
                ]
            );
        }
    }

    /**
     * Seed Gem Colors
     */
    private function seedColors(): void
    {
        $colors = [
            'C01' => 'storage/gem_colors/C01.png',
            'C02' => 'storage/gem_colors/C02.png',
            'C03' => 'storage/gem_colors/C03.png',
            'C04' => 'storage/gem_colors/C04.png',
            'C05' => 'storage/gem_colors/C05.png',
            'C06' => 'storage/gem_colors/C06.png',
            'C07' => 'storage/gem_colors/C07.png',
            'C08' => 'storage/gem_colors/C08.png',
            'C09' => 'storage/gem_colors/C09.png',
            'C10' => 'storage/gem_colors/C10.png',
            'C11' => 'storage/gem_colors/C11.png',
            'C12' => 'storage/gem_colors/C12.png',
            'C13' => 'storage/gem_colors/C13.png',
            'C14' => 'storage/gem_colors/C14.png',
            'C15' => 'storage/gem_colors/C15.png',
            'C16' => 'storage/gem_colors/C16.png',
            'C17' => 'storage/gem_colors/C17.png',
            'C18' => 'storage/gem_colors/C18.png',
            'C19' => 'storage/gem_colors/C19.png',
            'C20' => 'storage/gem_colors/C20.png',
            'C21' => 'storage/gem_colors/C21.png',
            'C22' => 'storage/gem_colors/C22.png',
            'C23' => 'storage/gem_colors/C23.png',
            'C24' => 'storage/gem_colors/C24.png',
            'C25' => 'storage/gem_colors/C25.png',
            'C26' => 'storage/gem_colors/C26.png',
            'C27' => 'storage/gem_colors/C27.png',
            'C28' => 'storage/gem_colors/C28.png',
            'C29' => 'storage/gem_colors/C29.png',
            'C30' => 'storage/gem_colors/C30.png',
            'C31' => 'storage/gem_colors/C31.png',
            'C32' => 'storage/gem_colors/C32.png',
            'C33' => 'storage/gem_colors/C33.png',
            'C34' => 'storage/gem_colors/C34.png',
            'C35' => 'storage/gem_colors/C35.png',
            'C36' => 'storage/gem_colors/C36.png',
            'C37' => 'storage/gem_colors/C37.png',
            'C38' => 'storage/gem_colors/C38.png',
            'C39' => 'storage/gem_colors/C39.png',
            'C40' => 'storage/gem_colors/C40.png',
            'C41' => 'storage/gem_colors/C41.png',
            'C42' => 'storage/gem_colors/C42.png',
            'C43' => 'storage/gem_colors/C43.png',
            'C44' => 'storage/gem_colors/C44.png',
            'C45' => 'storage/gem_colors/C45.png',
            'C46' => 'storage/gem_colors/C46.png',
            'C47' => 'storage/gem_colors/C47.png',
            'C48' => 'storage/gem_colors/C48.png',
            'C49' => 'storage/gem_colors/C49.png',
            'C50' => 'storage/gem_colors/C50.png',
            'C51' => 'storage/gem_colors/C51.png',
            'C52' => 'storage/gem_colors/C52.png',
            'C53' => 'storage/gem_colors/C53.png',
            'C54' => 'storage/gem_colors/C54.png',
            'C55' => 'storage/gem_colors/C55.png',
            'C56' => 'storage/gem_colors/C56.png',
            'C57' => 'storage/gem_colors/C57.png',
            'C58' => 'storage/gem_colors/C58.png',
            'C59' => 'storage/gem_colors/C59.png',
            'C60' => 'storage/gem_colors/C60.png',
            'C61' => 'storage/gem_colors/C61.png',
            'C62' => 'storage/gem_colors/C62.png',
            'C63' => 'storage/gem_colors/C63.png',
            'C64' => 'storage/gem_colors/C64.png',
            'C65' => 'storage/gem_colors/C65.png',
            'C67' => 'storage/gem_colors/C67.png',
            'C68' => 'storage/gem_colors/C68.png',
            'C69' => 'storage/gem_colors/C69.png',
            'C70' => 'storage/gem_colors/C70.png',
            'C71' => 'storage/gem_colors/C71.png',
            'C72' => 'storage/gem_colors/C72.png',
            'C73' => 'storage/gem_colors/C73.png',
            'C74' => 'storage/gem_colors/C74.png',
            'C75' => 'storage/gem_colors/C75.png',
            'C76' => 'storage/gem_colors/C76.png',
            'C77' => 'storage/gem_colors/C77.png',
        ];

        $order = 1;
        foreach ($colors as $name => $image) {
            GemColor::updateOrCreate(
                ['name' => $name],
                [
                    'image'      => $image,
                    'sort_order' => $order++,
                    'status'     => 'active',
                ]
            );
        }
    }
}
