<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $rows = $pdo->query('SELECT id, name, price, category, icon, image_url AS imageUrl, description, created_at AS createdAt, updated_at AS updatedAt FROM products ORDER BY id ASC')->fetchAll();
    json_response(['products' => $rows]);
}

// Writes require admin
require_admin();

$body = read_json_body();

if ($method === 'POST') {
    $name = trim((string)($body['name'] ?? ''));
    $price = (float)($body['price'] ?? 0);
    $category = trim((string)($body['category'] ?? ''));
    $icon = trim((string)($body['icon'] ?? ''));
    $imageUrl = trim((string)($body['imageUrl'] ?? ''));
    $description = trim((string)($body['description'] ?? ''));

    if (!$name || !$category || !$icon || !$description || $price <= 0) {
        json_response(['error' => 'Invalid product data'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO products (name, price, category, icon, image_url, description) VALUES (:name, :price, :category, :icon, :image_url, :description)');
    $stmt->execute([
        ':name' => $name,
        ':price' => $price,
        ':category' => $category,
        ':icon' => $icon,
        ':image_url' => $imageUrl,
        ':description' => $description,
    ]);

    $id = (int)$pdo->lastInsertId();
    $row = $pdo->prepare('SELECT id, name, price, category, icon, image_url AS imageUrl, description, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = :id');
    $row->execute([':id' => $id]);

    json_response(['product' => $row->fetch()], 201);
}

if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'Missing id'], 400);

    $name = trim((string)($body['name'] ?? ''));
    $price = (float)($body['price'] ?? 0);
    $category = trim((string)($body['category'] ?? ''));
    $icon = trim((string)($body['icon'] ?? ''));
    $imageUrl = trim((string)($body['imageUrl'] ?? ''));
    $description = trim((string)($body['description'] ?? ''));

    if (!$name || !$category || !$icon || !$description || $price <= 0) {
        json_response(['error' => 'Invalid product data'], 400);
    }

    $stmt = $pdo->prepare('UPDATE products SET name = :name, price = :price, category = :category, icon = :icon, image_url = :image_url, description = :description, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        ':id' => $id,
        ':name' => $name,
        ':price' => $price,
        ':category' => $category,
        ':icon' => $icon,
        ':image_url' => $imageUrl,
        ':description' => $description,
    ]);

    $row = $pdo->prepare('SELECT id, name, price, category, icon, image_url AS imageUrl, description, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = :id');
    $row->execute([':id' => $id]);
    $updated = $row->fetch();
    if (!$updated) json_response(['error' => 'Product not found'], 404);

    json_response(['product' => $updated]);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'Missing id'], 400);

    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);

    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed'], 405);
