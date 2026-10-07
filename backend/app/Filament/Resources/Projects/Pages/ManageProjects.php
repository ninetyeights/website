<?php

namespace App\Filament\Resources\Projects\Pages;

use App\Filament\Resources\Projects\ProjectResource;
use Filament\Resources\Pages\ManageRecords;

class ManageProjects extends ManageRecords
{
    protected static string $resource = ProjectResource::class;

    protected ?string $subheading = '直接切换启用状态或修改排序；停用同时关闭详情页与本站下载入口。';

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
