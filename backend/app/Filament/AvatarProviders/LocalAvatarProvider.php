<?php

namespace App\Filament\AvatarProviders;

use Filament\AvatarProviders\Contracts\AvatarProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

class LocalAvatarProvider implements AvatarProvider
{
    public function get(Model|Authenticatable $record): string
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#047857"/><circle cx="32" cy="24" r="10" fill="#ecfdf5"/><path d="M14 54a18 18 0 0 1 36 0" fill="#ecfdf5"/></svg>';

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
