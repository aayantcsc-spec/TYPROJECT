<?php

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/CricApiClient.php';

$client = new CricApiClient($config['cricapi']);
$offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
$result = $client->getLiveScores($offset);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PHP Cricket Live Scores</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; background:#f5f7fb; color:#1f2937; }
        .card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:16px; margin-bottom:12px; }
        .title { margin-top:0; }
        .meta { color:#6b7280; font-size:14px; }
        .team { display:flex; justify-content:space-between; margin:4px 0; }
        .ok { color:#166534; }
        .err { color:#b91c1c; }
        code { background:#eef2ff; padding:2px 6px; border-radius:5px; }
    </style>
    <script src="https://cdorgapi.b-cdn.net/widgets/score.js"></script>
</head>
<body>
    <h1 class="title">Live Cricket Scores (PHP + CricAPI)</h1>
    <p>Using endpoint: <code>https://api.cricapi.com/v1/cricScore</code></p>

    <?php if ($result['ok']): ?>
        <p class="ok">API request successful. Matches returned: <?= count($result['matches']) ?></p>
    <?php else: ?>
        <p class="err">API request failed: <?= htmlspecialchars((string)$result['error']) ?></p>
    <?php endif; ?>

    <?php if (count($result['matches']) === 0): ?>
        <div class="card">No matches available for this offset.</div>
    <?php else: ?>
        <?php foreach ($result['matches'] as $match): ?>
            <div class="card">
                <strong><?= htmlspecialchars(($match['t1'] ?? 'Team 1') . ' vs ' . ($match['t2'] ?? 'Team 2')) ?></strong>
                <div class="meta"><?= htmlspecialchars((string)($match['series'] ?? 'Unknown Series')) ?> · <?= htmlspecialchars((string)($match['matchType'] ?? 'N/A')) ?></div>
                <div class="team"><span><?= htmlspecialchars((string)($match['t1'] ?? 'Team 1')) ?></span><span><?= htmlspecialchars((string)($match['t1s'] ?? '')) ?></span></div>
                <div class="team"><span><?= htmlspecialchars((string)($match['t2'] ?? 'Team 2')) ?></span><span><?= htmlspecialchars((string)($match['t2s'] ?? '')) ?></span></div>
                <div class="meta">Status: <?= htmlspecialchars((string)($match['status'] ?? 'N/A')) ?></div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>

    <p>
        <a href="?offset=0">Offset 0</a> |
        <a href="?offset=25">Offset 25</a> |
        <a href="/countries.php">Countries List</a> |
        <a href="/matches.php">Match List API</a> |
        <a href="/series_list.php">Series List API</a> |
        <a href="/series_search.php">Series Search API</a> |
        <a href="/fantasy_scorecard.php">Fantasy Scorecard API</a> |
        <a href="/match_points.php">Match Points API</a> |
        <a href="/match_squad.php">Match Squad API</a>
    </p>
</body>
</html>
