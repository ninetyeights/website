<?php

namespace App\Exceptions;

use RuntimeException;

class TranslationException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly bool $retryable,
        int $status = 502,
        public readonly string $action = 'retry_later',
    ) {
        parent::__construct($message, $status);
    }
}
