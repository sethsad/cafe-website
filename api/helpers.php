<?php

declare(strict_types=1);

function send_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function read_json_body(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $payload = json_decode($rawBody, true);

    if (!is_array($payload)) {
        send_json(400, ['error' => 'Invalid JSON body.']);
    }

    return $payload;
}

function create_order_id(): string
{
    return bin2hex(random_bytes(8));
}
