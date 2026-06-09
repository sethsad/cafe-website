<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = db()->query(
        'SELECT id, order_code, customer_name, customer_phone, pickup_time, payment_method, total, status, created_at
         FROM orders
         ORDER BY created_at DESC'
    );

    $orders = $statement->fetchAll();
    $itemStatement = db()->prepare(
        'SELECT item_name AS name, item_price AS price, quantity AS qty, options_json, line_total
         FROM order_items
         WHERE order_id = ?
         ORDER BY id ASC'
    );

    foreach ($orders as &$order) {
        $itemStatement->execute([(int)$order['id']]);
        $items = $itemStatement->fetchAll();

        foreach ($items as &$item) {
            $options = json_decode((string)($item['options_json'] ?? '[]'), true);
            $item['options'] = is_array($options) ? $options : [];
            unset($item['options_json']);
        }

        $order['items'] = $items;
    }

    send_json(200, ['orders' => $orders]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $payload = read_json_body();
    $id = (int)($payload['id'] ?? 0);
    $status = trim((string)($payload['status'] ?? ''));
    $allowedStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

    if ($id <= 0 || !in_array($status, $allowedStatuses, true)) {
        send_json(400, ['error' => 'Valid order ID and status are required.']);
    }

    $statement = db()->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $statement->execute([$status, $id]);

    send_json(200, ['message' => 'Order status updated.']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['error' => 'Method not allowed.']);
}

$payload = read_json_body();
$customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
$items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

$name = trim((string)($customer['name'] ?? ''));
$phone = trim((string)($customer['phone'] ?? ''));
$pickup = trim((string)($payload['pickup'] ?? 'ASAP'));
$payment = trim((string)($payload['payment'] ?? 'Cash'));
$cleanItems = [];

foreach ($items as $item) {
    if (!is_array($item)) {
        continue;
    }

    $itemName = trim((string)($item['name'] ?? ''));
    $price = (float)($item['price'] ?? -1);
    $qty = (int)($item['qty'] ?? 0);
    $options = is_array($item['options'] ?? null) ? array_map('strval', $item['options']) : [];

    if ($itemName !== '' && $price >= 0 && $qty > 0) {
        $cleanItems[] = [
            'name' => $itemName,
            'price' => $price,
            'qty' => $qty,
            'options' => $options,
        ];
    }
}

if ($name === '' || $phone === '') {
    send_json(400, ['error' => 'Name and phone are required.']);
}

if (count($cleanItems) === 0) {
    send_json(400, ['error' => 'At least one cart item is required.']);
}

$total = 0;
foreach ($cleanItems as $item) {
    $total += $item['price'] * $item['qty'];
}

$pdo = db();
$orderCode = create_order_id();
$total = round($total, 2);

$pdo->beginTransaction();

try {
    $orderStatement = $pdo->prepare(
        'INSERT INTO orders (order_code, customer_name, customer_phone, pickup_time, payment_method, total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $orderStatement->execute([$orderCode, $name, $phone, $pickup, $payment, $total]);
    $orderId = (int)$pdo->lastInsertId();

    $itemStatement = $pdo->prepare(
        'INSERT INTO order_items (order_id, item_name, item_price, quantity, options_json, line_total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($cleanItems as $item) {
        $lineTotal = round($item['price'] * $item['qty'], 2);
        $itemStatement->execute([
            $orderId,
            $item['name'],
            $item['price'],
            $item['qty'],
            json_encode($item['options']),
            $lineTotal,
        ]);
    }

    $pdo->commit();
} catch (Throwable $error) {
    $pdo->rollBack();
    send_json(500, ['error' => 'Unable to save order.']);
}

$order = [
    'id' => $orderCode,
    'databaseId' => $orderId,
    'customer' => [
        'name' => $name,
        'phone' => $phone,
    ],
    'pickup' => $pickup,
    'payment' => $payment,
    'items' => $cleanItems,
    'total' => $total,
    'status' => 'received',
    'createdAt' => gmdate('c'),
];

send_json(201, [
    'message' => 'Order received.',
    'order' => $order,
]);
