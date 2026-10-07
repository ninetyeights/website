<?php

namespace App\Filament\Resources\Tools\Pages;

use App\Filament\Resources\Tools\ToolResource;
use Filament\Resources\Pages\ManageRecords;

class ManageTools extends ManageRecords
{
    protected static string $resource = ToolResource::class;

    protected ?string $subheading = '直接切换启用状态或修改排序；停用会隐藏入口并关闭详情页。修改后新请求即可生效。';

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
