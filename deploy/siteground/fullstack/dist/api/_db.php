<?php
require_once __DIR__ . '/_response.php';

function load_config(): array {
    $path = __DIR__ . '/config.php';
    if (!file_exists($path)) {
        json_response([
            'error' => 'API not configured. Missing api/config.php',
            'hint' => 'Copy api/config.example.php to api/config.php and fill in MySQL credentials.'
        ], 500);
    }

    $cfg = require $path;
    return is_array($cfg) ? $cfg : [];
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $cfg = load_config();
    $mysql = $cfg['mysql'] ?? [];

    $host = $mysql['host'] ?? '';
    $port = (int)($mysql['port'] ?? 3306);
    $dbname = $mysql['dbname'] ?? '';
    $user = $mysql['user'] ?? '';
    $pass = $mysql['pass'] ?? '';
    $charset = $mysql['charset'] ?? 'utf8mb4';

    if (!$host || !$dbname || !$user) {
        json_response(['error' => 'Invalid MySQL config in api/config.php'], 500);
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    migrate_if_needed($pdo);
    return $pdo;
}

function migrate_if_needed(PDO $pdo): void {
    static $done = false;
    if ($done) return;

    // Core tables (MySQL)
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        category VARCHAR(64) NOT NULL,
        icon VARCHAR(16) NOT NULL,
        image_url LONGTEXT NOT NULL,
        description LONGTEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        items_json LONGTEXT NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        customer_json LONGTEXT NOT NULL,
        status VARCHAR(32) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
        email VARCHAR(255) NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        address LONGTEXT NOT NULL,
        total_orders INT NOT NULL DEFAULT 0,
        total_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
        last_order_id VARCHAR(64) NULL,
        last_order_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        message LONGTEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_tokens (
        token CHAR(64) NOT NULL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default products once
    $count = (int)($pdo->query('SELECT COUNT(1) AS c FROM products')->fetch()['c'] ?? 0);
    if ($count === 0) {
        $defaults = [
            ['Premium Shoes', 89.99, 'footwear', '👟', '', 'Comfortable and stylish premium shoes'],
            ['Classic Shirt', 34.99, 'clothing', '👕', '', 'High-quality cotton shirt'],
            ['Denim Jeans', 59.99, 'clothing', '👖', '', 'Classic blue denim jeans'],
            ['Winter Jacket', 129.99, 'outerwear', '🧥', '', 'Warm and waterproof winter jacket'],
            ['Casual Hat', 24.99, 'accessories', '🧢', '', 'Comfortable casual baseball hat'],
            ['Leather Belt', 44.99, 'accessories', '⌚', '', 'Premium leather belt'],
            ['Sports Watch', 199.99, 'accessories', '⌚', '', 'Digital sports watch with timer'],
            ['Sunglasses', 89.99, 'accessories', '😎', '', 'UV-protected sunglasses'],
            ['Wool Sweater', 74.99, 'clothing', '🧶', '', 'Cozy wool sweater'],
            ['Running Shoes', 99.99, 'footwear', '🏃', '', 'High-performance running shoes'],
        ];

        $stmt = $pdo->prepare('INSERT INTO products (name, price, category, icon, image_url, description) VALUES (:name, :price, :category, :icon, :image_url, :description)');
        foreach ($defaults as $d) {
            $stmt->execute([
                ':name' => $d[0],
                ':price' => $d[1],
                ':category' => $d[2],
                ':icon' => $d[3],
                ':image_url' => $d[4],
                ':description' => $d[5],
            ]);
        }
    }

    $done = true;
}
