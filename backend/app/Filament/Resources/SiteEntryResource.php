<?php

namespace App\Filament\Resources;

use App\Models\SiteEntry;
use Filament\Resources\Resource;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\TextInputColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use UnitEnum;

abstract class SiteEntryResource extends Resource
{
    protected static ?string $model = SiteEntry::class;

    protected static string|UnitEnum|null $navigationGroup = '内容管理';

    protected static ?string $recordTitleAttribute = 'name';

    protected static string $kind;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('kind', static::$kind);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')->label('名称')->searchable(),
            TextColumn::make('slug')->label('页面标识')->color('gray')->searchable(),
            ToggleColumn::make('enabled')->label('启用')->rules(['required', 'boolean'])
                ->disabled(fn (SiteEntry $record): bool => ! Gate::allows('update', $record))
                ->updateStateUsing(function (SiteEntry $record, mixed $state): bool {
                    Gate::authorize('update', $record);
                    $record->update(['enabled' => (bool) $state]);

                    return $record->enabled;
                }),
            TextInputColumn::make('sort_order')->label('排序（小的在前）')->type('number')
                ->rules(['required', 'integer', 'between:0,9999'])
                ->disabled(fn (SiteEntry $record): bool => ! Gate::allows('update', $record))
                ->updateStateUsing(function (SiteEntry $record, mixed $state): int {
                    Gate::authorize('update', $record);
                    $record->update(['sort_order' => (int) $state]);

                    return $record->sort_order;
                }),
            TextColumn::make('updated_at')->label('最近更新')->dateTime('Y-m-d H:i')->sortable(),
        ])->filters([
            TernaryFilter::make('enabled')->label('启用状态')->trueLabel('已启用')->falseLabel('已停用'),
        ])->defaultSort('sort_order')->recordActions([])->toolbarActions([]);
    }
}
