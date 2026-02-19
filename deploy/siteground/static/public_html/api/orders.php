<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $body = read_json_body();

    $id = trim((string)($body['id'] ?? ''));
    $items = $body['items'] ?? [];
    $total = (float)($body['total'] ?? 0);
    $customer = $body['customer'] ?? [];
    $status = trim((string)($body['status'] ?? 'placed'));

    if (!$id || !is_array($items) || !$total || !is_array($customer)) {
        json_response(['error' => 'Invalid order payload'], 400);
    }

    $customerEmail = trim((string)($customer['email'] ?? ''));
    $customerName = trim((string)($customer['name'] ?? ''));
    $customerAddress = trim((string)($customer['address'] ?? ''));

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO orders (id, items_json, total, customer_json, status) VALUES (:id, :items_json, :total, :customer_json, :status)');
        $stmt->execute([
            ':id' => $id,
            ':items_json' => json_encode($items, JSON_UNESCAPED_SLASHES),
            ':total' => $total,
            ':customer_json' => json_encode($customer, JSON_UNESCAPED_SLASHES),
            ':status' => $status,
        ]);

        if ($customerEmail) {
            $upsert = $pdo->prepare("INSERT INTO clients (email, name, address, total_orders, total_spend, last_order_id, last_order_at)
                VALUES (:email, :name, :address, 1, :spend, :order_id, NOW())
                ON DUPLICATE KEY UPDATE
                  name = VALUES(name),
                  address = VALUES(address),
                  total_orders = clients.total_orders + 1,
                  total_spend = clients.total_spend + VALUES(total_spend),
                  last_order_id = VALUES(last_order_id),
                  last_order_at = NOW()"
            );
            $upsert->execute([
                ':email' => $customerEmail,
                ':name' => $customerName,
                ':address' => $customerAddress,
                ':spend' => $total,
                ':order_id' => $id,
            ]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_response(['success' => true, 'orderId' => $id]);
}

if ($method === 'GET') {
    // Admin list orders (requires token)
    require_admin();
    $rows = $pdo->query('SELECT id, total, customer_json, status, created_at FROM orders ORDER BY created_at DESC')->fetchAll();
    $orders = [];
    foreach ($rows as $r) {
        $orders[] = [
            'id' => $r['id'],
            'total' => (float)$r['total'],
            'customer' => json_decode($r['customer_json'], true) ?: new stdClass(),
            'status' => $r['status'],
            'createdAt' => $r['created_at'],
        ];
    }
    json_response(['orders' => $orders]);
}

json_response(['error' => 'Method not allowed'], 405);
