<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';

try {
    $pdo = get_pdo();
    json_response(['success' => true, 'message' => 'Database connection successful.']);
} catch (Exception $e) {
    json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
