<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class AdminWelcome extends Widget
{
    protected int|string|array $columnSpan = 'full';

    protected string $view = 'filament.widgets.admin-welcome';
}
