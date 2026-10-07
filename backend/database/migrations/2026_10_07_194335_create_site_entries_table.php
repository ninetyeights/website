<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_entries', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 16);
            $table->string('slug', 100);
            $table->string('name');
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unique(['kind', 'slug']);
            $table->timestamps();
        });

        $entries = [
            ['tool', 'link-extract', '链接提取'],
            ['tool', 'translate', '文本翻译'],
            ['tool', 'text-compare', '文字对比'],
            ['tool', 'timestamp', '时间戳转换'],
            ['tool', 'password', '密码生成'],
            ['project', 'magidesk', 'MagiDesk'],
            ['project', 'audiodeviceswitcher', 'AudioDeviceSwitcher'],
            ['project', 'lyricdrop', 'LyricDrop'],
        ];
        foreach ($entries as $index => [$kind, $slug, $name]) {
            DB::table('site_entries')->insert([
                'kind' => $kind, 'slug' => $slug, 'name' => $name,
                'enabled' => true, 'sort_order' => ($index + 1) * 10,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_entries');
    }
};
