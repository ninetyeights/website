<?php

namespace App\Filament\Resources\Tools;

use App\Filament\Resources\SiteEntryResource;
use App\Filament\Resources\Tools\Pages\ManageTools;
use BackedEnum;
use Filament\Support\Icons\Heroicon;

class ToolResource extends SiteEntryResource
{
    protected static string $kind = 'tool';

    protected static ?string $modelLabel = '工具';

    protected static ?string $pluralModelLabel = '工具管理';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function getPages(): array
    {
        return [
            'index' => ManageTools::route('/'),
        ];
    }
}
