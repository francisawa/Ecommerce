<?php
// Copy this file to config.php and fill in your SiteGround MySQL credentials.
// IMPORTANT: Do NOT commit config.php to git and do NOT expose it publicly.

return [
    'mysql' => [
        // On SiteGround, MySQL host is often "localhost" (or a provided host).
        'host' => 'localhost',
        'port' => 3306,
        // Your MySQL database name (create it in Site Tools → MySQL).
        'dbname' => 'YOUR_MYSQL_DBNAME',
        'user' => 'YOUR_MYSQL_USER',
        'pass' => 'YOUR_MYSQL_PASSWORD',
        'charset' => 'utf8mb4',
    ],

    // Admin login for the PHP API.
    // Generate a hash with PHP: password_hash('yourPassword', PASSWORD_DEFAULT)
    'admin' => [
        'username' => 'admin',
        'password_hash' => 'REPLACE_WITH_PASSWORD_HASH',
        // Change this to a long random string.
        'token_secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET',
        'token_ttl_seconds' => 86400,
    ],
];
