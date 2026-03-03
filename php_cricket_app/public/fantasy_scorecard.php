<?php

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/CricApiClient.php';

$client = new CricApiClient($config['cricapi']);
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
$result = $id === '' ? ['ok' => false, 'error' => 'Provide ?id=<match_id>', 'data' => [], 'raw' => null] : $client->getFantasyScorecard($id);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Fantasy Scorecard API</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;background:#f5f7fb;color:#1f2937}.ok{color:#166534}.err{color:#b91c1c}input{padding:8px;border:1px solid #d1d5db;border-radius:6px}button{padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer}pre{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;overflow:auto}</style>
</head>
<body>
<h1>PHP Code Fantasy Scorecard API</h1>
<form method="get" action="">
    <input type="text" name="id" placeholder="Match ID" value="<?= htmlspecialchars($id) ?>" style="width:360px">
    <button type="submit">Fetch</button>
</form>

<?php if ($result['ok']): ?>
<p class="ok">Success.</p>
<?php else: ?>
<p class="err">Error: <?= htmlspecialchars((string)$result['error']) ?></p>
<?php endif; ?>

<pre><?= htmlspecialchars(json_encode($result['raw'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: 'No data') ?></pre>
<p><a href="/">Back</a></p>
</body>
</html>
