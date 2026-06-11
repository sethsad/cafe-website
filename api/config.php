<?php

declare(strict_types=1);

function config_value(string $name, string $default): string
{
    $value = getenv($name);

    if ($value === false || trim($value) === '') {
        return $default;
    }

    return $value;
}

define('DB_HOST', config_value('CAFE_DB_HOST', '127.0.0.1'));
define('DB_PORT', (int) config_value('CAFE_DB_PORT', '3306'));
define('DB_NAME', config_value('CAFE_DB_NAME', 'cafe_aroma'));
define('DB_USER', config_value('CAFE_DB_USER', 'root'));
define('DB_PASS', config_value('CAFE_DB_PASS', 'root'));
