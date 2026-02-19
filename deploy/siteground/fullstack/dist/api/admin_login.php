<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$cfg = load_config();
$admin = $cfg['admin'] ?? [];

$body = read_json_body();
$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');

if (!$username || !$password) {
    json_response(['error' => 'Username and password required'], 400);
}

$expectedUser = (string)($admin['username'] ?? '');
$hash = (string)($admin['password_hash'] ?? '');
$ttl = (int)($admin['token_ttl_seconds'] ?? 86400);
$secret = (string)($admin['token_secret'] ?? '');

if (!$expectedUser || !$hash || !$secret || strlen($secret) < 16) {
    json_response(['error' => 'Admin API not configured (check api/config.php)'], 500);
}

if (!hash_equals($expectedUser, $username) || !password_verify($password, $hash)) {
    json_response(['error' => 'Invalid credentials'], 401);
}

$pdo = get_pdo();
$token = hash('sha256', $username . '|' . microtime(true) . '|' . random_bytes(32) . '|' . $secret);
$expiresAt = gmdate('c', time() + $ttl);

$stmt = $pdo->prepare('INSERT INTO admin_tokens (token, username, expires_at) VALUES (:token, :username, :expires_at)');
$stmt->execute([
    ':token' => $token,
    ':username' => $username,
    ':expires_at' => $expiresAt,
]);

json_response([
    'token' => $token,
    'expiresIn' => $ttl,
    'message' => 'Login successful',
]);
