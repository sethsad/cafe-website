<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['error' => 'Method not allowed.']);
}

$payload = read_json_body();
$username = trim((string)($payload['username'] ?? ''));
$password = (string)($payload['password'] ?? '');

function ensure_default_admin(): void
{
    $statement = db()->prepare(
        'INSERT INTO users (username, password, name, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)'
    );
    $statement->execute(['admin', 'cafe123', 'Cafe Admin', 'admin']);
}

ensure_default_admin();

$statement = db()->prepare('SELECT username, password, name, role FROM users WHERE username = ? LIMIT 1');
$statement->execute([$username]);
$user = $statement->fetch();

if ($user && hash_equals((string)$user['password'], $password)) {
    send_json(200, [
        'message' => 'Login successful.',
        'user' => [
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
        ],
    ]);
}

send_json(401, ['error' => 'Invalid username or password.']);
