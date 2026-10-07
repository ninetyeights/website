<?php

namespace Database\Factories;

use App\Models\SiteEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SiteEntry>
 */
class SiteEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kind' => 'tool',
            'slug' => fake()->unique()->slug(),
            'name' => fake()->words(2, true),
            'enabled' => true,
            'sort_order' => fake()->numberBetween(0, 9999),
        ];
    }
}
