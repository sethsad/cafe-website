<?php

declare(strict_types=1);

require __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $error) {
        send_json(500, [
            'error' => 'Database connection failed. Check api/config.php and import database/cafe_aroma.sql in phpMyAdmin.',
        ]);
    }

    return $pdo;
}
