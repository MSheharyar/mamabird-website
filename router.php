<?php
// Local development only:  php -S localhost:8000 router.php
// Mimics the .htaccess clean URLs (/book -> book.php). The live site uses
// .htaccess on Apache and never runs this file (.htaccess 404s it).
if (PHP_SAPI !== 'cli-server') { http_response_code(404); exit; }

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$qs   = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';

// Old .html/.php addresses -> extensionless, as the live 301s do.
if (preg_match('#^/(.+?)\.(html|php)$#', $path, $m) && $m[1] !== 'router') {
    $to = $m[1] === 'index' ? '/' : ($m[1] === 'ebook' ? '/book' : '/' . $m[1]);
    header('Location: ' . $to . $qs, true, 301);
    exit;
}
if ($path === '/ebook') { header('Location: /book' . $qs, true, 301); exit; }

// Real files (css, js, images) are served as they are.
if ($path !== '/' && is_file(__DIR__ . $path)) { return false; }

$page = trim($path, '/');
if ($page === '') { $page = 'index'; }
if (preg_match('#^[a-z0-9-]+$#', $page) && $page !== 'router' && is_file(__DIR__ . "/$page.php")) {
    require __DIR__ . "/$page.php";
    return true;
}
http_response_code(404);
require __DIR__ . '/404.php';
