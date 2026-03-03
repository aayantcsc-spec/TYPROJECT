<?php

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/CricApiClient.php';

$client = new CricApiClient($config['cricapi']);
$offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
$search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';
$result = $client->searchSeries($search, $offset);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Series Search API</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;background:#f5f7fb;color:#1f2937}.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:10px}.ok{color:#166534}.err{color:#b91c1c}.meta{color:#6b7280}input{padding:8px;border:1px solid #d1d5db;border-radius:6px}button{padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer}</style>
</head>
<body>
<h1>PHP Code Series Search API</h1>
<form method="get" action="">
    <input type="text" name="search" placeholder="Search series" value="<?= htmlspecialchars($search) ?>">
    <input type="number" name="offset" value="<?= (int)$offset ?>" min="0">
    <button type="submit">Search</button>
</form>

<?php if ($result['ok']): ?>
<p class="ok">Success. Series fetched: <?= count($result['series']) ?></p>
<?php else: ?>
<p class="err">Error: <?= htmlspecialchars((string)$result['error']) ?></p>
<?php endif; ?>

<?php foreach ($result['series'] as $series): ?>
<div class="card">
    <strong><?= htmlspecialchars((string)($series['name'] ?? 'Unknown Series')) ?></strong>
    <div class="meta">ID: <?= htmlspecialchars((string)($series['id'] ?? 'N/A')) ?></div>
</div>
<?php endforeach; ?>

<p><a href="/">Back</a></p>
</body>
</html>
