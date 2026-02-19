<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';

function require_admin(): array {
    $token = get_auth_bearer_token();
    if (!$token) {
        json_response(['error' => 'Missing admin token'], 401);
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT username, expires_at FROM admin_tokens WHERE token = :token');
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();

    if (!$row) {
        json_response(['error' => 'Invalid admin token'], 403);
    }

    $expiresAt = strtotime($row['expires_at']);
    if ($expiresAt !== false && $expiresAt < time()) {
        // Cleanup expired token
        $pdo->prepare('DELETE FROM admin_tokens WHERE token = :token')->execute([':token' => $token]);
        json_response(['error' => 'Expired admin token'], 403);
    }

    return $row;
}
