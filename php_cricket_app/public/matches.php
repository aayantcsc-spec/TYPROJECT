<?php

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/CricApiClient.php';

$client = new CricApiClient($config['cricapi']);
$offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
$result = $client->getMatches($offset);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Matches List API</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;background:#f5f7fb;color:#1f2937}.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:10px}.ok{color:#166534}.err{color:#b91c1c}.meta{color:#6b7280}</style>
</head>
<body>
<h1>PHP Code Match List API</h1>
<?php if ($result['ok']): ?>
<p class="ok">Success. Matches fetched: <?= count($result['matches']) ?></p>
<?php else: ?>
<p class="err">Error: <?= htmlspecialchars((string)$result['error']) ?></p>
<?php endif; ?>

<?php foreach ($result['matches'] as $match): ?>
<div class="card">
    <strong><?= htmlspecialchars(($match['name'] ?? (($match['t1'] ?? 'Team 1') . ' vs ' . ($match['t2'] ?? 'Team 2')))) ?></strong>
    <div class="meta"><?= htmlspecialchars((string)($match['matchType'] ?? 'N/A')) ?> · <?= htmlspecialchars((string)($match['status'] ?? 'N/A')) ?></div>
</div>
<?php endforeach; ?>

<p><a href="?offset=0">Offset 0</a> | <a href="?offset=25">Offset 25</a> | <a href="/">Back</a></p>
</body>
</html>
