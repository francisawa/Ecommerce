<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

require_admin();
$pdo = get_pdo();
$rows = $pdo->query('SELECT email, name, total_orders AS totalOrders, total_spend AS totalSpend, last_order_at AS lastOrderAt FROM clients ORDER BY last_order_at DESC')->fetchAll();
json_response(['clients' => $rows]);
