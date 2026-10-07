<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

#[Signature('app:create-admin')]
#[Description('交互式创建管理后台账号，不覆盖已有账号')]
class CreateAdmin extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('请在交互式终端运行 app:create-admin，安全输入账号和密码。');

            return self::FAILURE;
        }

        $data = [
            'name' => $this->ask('管理员名称'),
            'email' => strtolower(trim((string) $this->ask('登录邮箱'))),
            'password' => $this->secret('密码（至少 12 位，包含大小写字母和数字）'),
            'password_confirmation' => $this->secret('再次输入密码'),
        ];
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        User::make(collect($data)->only(['name', 'email', 'password'])->all())
            ->forceFill(['is_admin' => true])->save();
        $this->info('管理员账号已创建。访问 /admin 登录，首次登录请绑定验证器并保存恢复码。');

        return self::SUCCESS;
    }
}
