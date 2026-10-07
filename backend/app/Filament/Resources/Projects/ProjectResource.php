<?php

namespace App\Filament\Resources\Projects;

use App\Filament\Resources\Projects\Pages\ManageProjects;
use App\Filament\Resources\SiteEntryResource;
use BackedEnum;
use Filament\Support\Icons\Heroicon;

class ProjectResource extends SiteEntryResource
{
    protected static string $kind = 'project';

    protected static ?string $modelLabel = '项目';

    protected static ?string $pluralModelLabel = '项目管理';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function getPages(): array
    {
        return [
            'index' => ManageProjects::route('/'),
        ];
    }
}
