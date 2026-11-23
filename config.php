<?php
declare(strict_types=1);

session_start();

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'gym_management');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

function getPDO(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_PORT,
            DB_NAME
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function requireAuth(): array
{
    if (empty($_SESSION['user'])) {
        jsonResponse(['error' => 'Authentication required'], 401);
    }
    return $_SESSION['user'];
}

function requireRoles(array $allowed): array
{
    $user = requireAuth();
    if (!in_array($user['roleType'], $allowed, true)) {
        jsonResponse(['error' => 'Insufficient permissions'], 403);
    }
    return $user;
}

function verifyPassword(string $input, string $stored): bool
{
    if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$argon2')) {
        return password_verify($input, $stored);
    }
    return hash_equals($stored, $input);
}
