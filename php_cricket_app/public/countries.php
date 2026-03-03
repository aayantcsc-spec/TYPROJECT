<?php

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/CricApiClient.php';

$client = new CricApiClient($config['cricapi']);
$result = $client->getAllCountries();

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Countries List - CricAPI</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; background:#f5f7fb; color:#1f2937; }
        .card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:16px; margin-bottom:12px; }
        .ok { color:#166534; }
        .err { color:#b91c1c; }
        ul { margin: 0; padding-left: 20px; }
        li { margin: 4px 0; }
    </style>
</head>
<body>
    <h1>Countries List (All Pages)</h1>

    <?php if (!$result['ok']): ?>
        <p class="err"><?= htmlspecialchars((string)$result['error']) ?></p>
    <?php else: ?>
        <p class="ok">Final countries List contains <?= (int)$result['total'] ?> elements</p>
        <div class="card">
            <strong>Preview (first 25):</strong>
            <ul>
                <?php foreach (array_slice($result['countries'], 0, 25) as $country): ?>
                    <li>
                        <?= htmlspecialchars((string)($country['name'] ?? 'Unknown')) ?>
                        (<?= htmlspecialchars((string)($country['id'] ?? 'N/A')) ?>)
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <p><a href="/">Back to Live Scores</a></p>
</body>
</html>
