<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $body = read_json_body();

    $id = trim((string)($body['id'] ?? ''));
    $name = trim((string)($body['name'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $subject = trim((string)($body['subject'] ?? ''));
    $message = trim((string)($body['message'] ?? ''));

    if (!$id || !$email || !$subject || !$message) {
        json_response(['error' => 'Invalid message payload'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO messages (id, name, email, subject, message, status) VALUES (:id, :name, :email, :subject, :message, :status)');
    $stmt->execute([
        ':id' => $id,
        ':name' => $name,
        ':email' => $email,
        ':subject' => $subject,
        ':message' => $message,
        ':status' => 'new',
    ]);

    json_response(['success' => true, 'messageId' => $id]);
}

if ($method === 'GET') {
    // Admin list messages
    require_admin();
    $rows = $pdo->query('SELECT id, name, email, subject, message, status, created_at FROM messages ORDER BY created_at DESC')->fetchAll();
    json_response(['messages' => $rows]);
}

json_response(['error' => 'Method not allowed'], 405);
