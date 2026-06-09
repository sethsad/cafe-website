<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

function ensure_menu_items_table(): void
{
    db()->exec(
        "CREATE TABLE IF NOT EXISTS menu_items (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            category VARCHAR(40) NOT NULL,
            label VARCHAR(80) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    );
}

function seed_menu_items(): void
{
    $count = (int)db()->query('SELECT COUNT(*) FROM menu_items')->fetchColumn();

    if ($count > 0) {
        return;
    }

    $items = [
        ['Espresso', 'hot', 'Hot coffee', 'Bold, compact, and rich with crema.', 2.50, '/img/png-08.avif'],
        ['Cappuccino', 'hot', 'Hot coffee', 'Espresso with steamed milk and airy foam.', 3.00, '/img/png-09.png'],
        ['Vanilla Latte', 'hot', 'Signature', 'Silky milk, espresso, and gentle vanilla.', 3.75, '/img/png-03.avif'],
        ['Cold Brew', 'cold', 'Cold coffee', 'Slow-steeped coffee served crisp over ice.', 4.00, '/img/png-10.png'],
        ['Chocolate Frappe', 'blended', 'Blended', 'Chilled chocolate coffee with whipped cream.', 4.95, '/img/png-02.png'],
        ['Butter Croissant', 'bakery', 'Bakery', 'Flaky pastry baked golden each morning.', 2.95, '/img/png-04.jpg'],
        ['Iced Matcha Tea', 'tea', 'Tea', 'Green tea, milk, ice, and a smooth earthy finish.', 4.25, '/img/png-02.jpg'],
        ['Chocolate Muffin', 'bakery', 'Bakery', 'Soft cocoa muffin with dark chocolate chips.', 3.25, '/img/png-03.jpg'],
    ];

    $statement = db()->prepare(
        'INSERT INTO menu_items (name, category, label, description, price, image_url)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($items as $item) {
        $statement->execute($item);
    }
}

function clean_item_payload(array $payload): array
{
    $name = trim((string)($payload['name'] ?? ''));
    $category = trim((string)($payload['category'] ?? ''));
    $label = trim((string)($payload['label'] ?? ''));
    $description = trim((string)($payload['description'] ?? ''));
    $price = (float)($payload['price'] ?? -1);
    $imageUrl = trim((string)($payload['image_url'] ?? ''));
    $isActive = isset($payload['is_active']) ? (int)(bool)$payload['is_active'] : 1;

    if ($label === '') {
        $label = ucwords(str_replace(['-', '_'], ' ', $category));
    }

    if ($imageUrl === '') {
        $imageUrl = '/img/png-01.jpg';
    }

    if ($name === '' || $category === '' || $description === '' || $price < 0) {
        send_json(400, ['error' => 'Name, category, description, and price are required.']);
    }

    return [
        'name' => $name,
        'category' => $category,
        'label' => $label,
        'description' => $description,
        'price' => round($price, 2),
        'image_url' => $imageUrl,
        'is_active' => $isActive,
    ];
}

ensure_menu_items_table();
seed_menu_items();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $includeAll = isset($_GET['all']) && $_GET['all'] === '1';
    $sql = 'SELECT id, name, category, label, description, price, image_url, is_active, created_at, updated_at
            FROM menu_items';

    if (!$includeAll) {
        $sql .= ' WHERE is_active = 1';
    }

    $sql .= ' ORDER BY created_at DESC, id DESC';

    $items = db()->query($sql)->fetchAll();
    send_json(200, ['items' => $items]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = read_json_body();
    $item = clean_item_payload($payload);

    $statement = db()->prepare(
        'INSERT INTO menu_items (name, category, label, description, price, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        $item['name'],
        $item['category'],
        $item['label'],
        $item['description'],
        $item['price'],
        $item['image_url'],
        $item['is_active'],
    ]);

    send_json(201, [
        'message' => 'Menu item created.',
        'item' => ['id' => (int)db()->lastInsertId()] + $item,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $payload = read_json_body();
    $id = (int)($payload['id'] ?? 0);

    if ($id <= 0) {
        send_json(400, ['error' => 'Menu item ID is required.']);
    }

    $item = clean_item_payload($payload);
    $statement = db()->prepare(
        'UPDATE menu_items
         SET name = ?, category = ?, label = ?, description = ?, price = ?, image_url = ?, is_active = ?
         WHERE id = ?'
    );
    $statement->execute([
        $item['name'],
        $item['category'],
        $item['label'],
        $item['description'],
        $item['price'],
        $item['image_url'],
        $item['is_active'],
        $id,
    ]);

    send_json(200, ['message' => 'Menu item updated.']);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $payload = read_json_body();
    $id = (int)($payload['id'] ?? 0);

    if ($id <= 0) {
        send_json(400, ['error' => 'Menu item ID is required.']);
    }

    $statement = db()->prepare('DELETE FROM menu_items WHERE id = ?');
    $statement->execute([$id]);

    send_json(200, ['message' => 'Menu item deleted.']);
}

send_json(405, ['error' => 'Method not allowed.']);
