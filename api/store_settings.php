<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

function ensure_store_settings_table(): void
{
    db()->exec(
        "CREATE TABLE IF NOT EXISTS store_settings (
            setting_key VARCHAR(80) PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    );
}

function default_store_settings(): array
{
    return [
        'store_name' => 'Cafe Aroma',
        'address' => 'Street 123, Riverside, Phnom Penh',
        'phone' => '+855 12 345 678',
        'hours' => 'Mon - Sun, 7:00 AM - 9:00 PM',
        'receipt_footer' => 'Thank you for ordering from Cafe Aroma.',
    ];
}

function seed_store_settings(): void
{
    $statement = db()->prepare(
        'INSERT IGNORE INTO store_settings (setting_key, setting_value) VALUES (?, ?)'
    );

    foreach (default_store_settings() as $key => $value) {
        $statement->execute([$key, $value]);
    }
}

function read_store_settings(): array
{
    $settings = default_store_settings();
    $rows = db()->query('SELECT setting_key, setting_value FROM store_settings')->fetchAll();

    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    return $settings;
}

ensure_store_settings_table();
seed_store_settings();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json(200, ['settings' => read_store_settings()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = read_json_body();
    $allowedKeys = array_keys(default_store_settings());
    $statement = db()->prepare(
        'INSERT INTO store_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );

    foreach ($allowedKeys as $key) {
        if (array_key_exists($key, $payload)) {
            $statement->execute([$key, trim((string)$payload[$key])]);
        }
    }

    send_json(200, [
        'message' => 'Store settings saved.',
        'settings' => read_store_settings(),
    ]);
}

send_json(405, ['error' => 'Method not allowed.']);
