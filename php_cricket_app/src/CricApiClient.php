<?php

declare(strict_types=1);

class CricApiClient
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['base_url'] ?? '', '/');
        $this->apiKey = $config['api_key'] ?? '';
        $this->timeout = (int)($config['timeout'] ?? 15);
    }

    private function request(string $endpoint, array $params = []): array
    {
        $query = array_merge(['apikey' => $this->apiKey], $params);
        $url = $this->baseUrl . '/' . ltrim($endpoint, '/');
        $url .= '?' . http_build_query($query);

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => $this->timeout,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\n",
            ],
        ]);

        $responseBody = @file_get_contents($url, false, $context);

        if ($responseBody === false) {
            return [
                'ok' => false,
                'error' => 'Unable to connect to CricAPI endpoint.',
                'raw' => null,
                'data' => [],
                'info' => null,
            ];
        }

        $decoded = json_decode($responseBody, true);
        if (!is_array($decoded)) {
            return [
                'ok' => false,
                'error' => 'Invalid JSON response from CricAPI.',
                'raw' => $responseBody,
                'data' => [],
                'info' => null,
            ];
        }

        $isSuccess = ($decoded['status'] ?? '') === 'success';

        return [
            'ok' => $isSuccess,
            'error' => $isSuccess ? null : (string)($decoded['info'] ?? 'Unknown API error'),
            'raw' => $decoded,
            'data' => is_array($decoded['data'] ?? null) ? $decoded['data'] : [],
            'info' => $decoded['info'] ?? null,
        ];
    }

    public function getLiveScores(int $offset = 0): array
    {
        $response = $this->request('cricScore', ['offset' => $offset]);

        return [
            'ok' => $response['ok'],
            'error' => $response['error'],
            'raw' => $response['raw'],
            'matches' => $response['data'],
        ];
    }

    public function getMatches(int $offset = 0): array
    {
        $response = $this->request('matches', ['offset' => $offset]);
        return [
            'ok' => $response['ok'],
            'error' => $response['error'],
            'raw' => $response['raw'],
            'matches' => $response['data'],
        ];
    }

    public function getSeriesList(int $offset = 0): array
    {
        $response = $this->request('series', ['offset' => $offset]);
        return [
            'ok' => $response['ok'],
            'error' => $response['error'],
            'raw' => $response['raw'],
            'series' => $response['data'],
        ];
    }

    public function searchSeries(string $search = '', int $offset = 0): array
    {
        $params = ['offset' => $offset];
        if (trim($search) !== '') {
            $params['search'] = trim($search);
        }

        $response = $this->request('series', $params);
        return [
            'ok' => $response['ok'],
            'error' => $response['error'],
            'raw' => $response['raw'],
            'series' => $response['data'],
        ];
    }

    public function getFantasyScorecard(string $matchId): array
    {
        $matchId = trim($matchId);
        if ($matchId === '') {
            return ['ok' => false, 'error' => 'Match ID is required.', 'raw' => null, 'data' => []];
        }

        $response = $this->request('fantasyScorecard', ['id' => $matchId]);
        if ($response['ok']) {
            return ['ok' => true, 'error' => null, 'raw' => $response['raw'], 'data' => $response['data']];
        }

        $fallback = $this->request('match_scorecard', ['id' => $matchId]);
        return ['ok' => $fallback['ok'], 'error' => $fallback['error'], 'raw' => $fallback['raw'], 'data' => $fallback['data']];
    }

    public function getMatchPoints(string $matchId): array
    {
        $matchId = trim($matchId);
        if ($matchId === '') {
            return ['ok' => false, 'error' => 'Match ID is required.', 'raw' => null, 'data' => []];
        }

        $response = $this->request('match_points', ['id' => $matchId]);
        return ['ok' => $response['ok'], 'error' => $response['error'], 'raw' => $response['raw'], 'data' => $response['data']];
    }

    public function getMatchSquad(string $matchId): array
    {
        $matchId = trim($matchId);
        if ($matchId === '') {
            return ['ok' => false, 'error' => 'Match ID is required.', 'raw' => null, 'data' => []];
        }

        $response = $this->request('match_squad', ['id' => $matchId]);
        return ['ok' => $response['ok'], 'error' => $response['error'], 'raw' => $response['raw'], 'data' => $response['data']];
    }

    public function getAllCountries(): array
    {
        $countriesList = [];
        $offset = 0;
        $maxOffset = 1;

        while ($offset < $maxOffset) {
            $url = sprintf(
                '%s/countries?apikey=%s&offset=%d',
                $this->baseUrl,
                rawurlencode($this->apiKey),
                $offset
            );

            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => $this->timeout,
                    'ignore_errors' => true,
                    'header' => "Accept: application/json\r\n",
                ],
            ]);

            $responseBody = @file_get_contents($url, false, $context);
            if ($responseBody === false) {
                return [
                    'ok' => false,
                    'error' => 'Unable to connect to CricAPI countries endpoint.',
                    'countries' => [],
                    'total' => 0,
                ];
            }

            $decoded = json_decode($responseBody, true);
            if (!is_array($decoded) || ($decoded['status'] ?? '') !== 'success') {
                return [
                    'ok' => false,
                    'error' => 'FAILED TO GET A SUCCESS RESULT',
                    'countries' => [],
                    'total' => 0,
                ];
            }

            $totalRows = (int)($decoded['info']['totalRows'] ?? 0);
            if ($totalRows > 0) {
                $maxOffset = $totalRows;
            }

            $batch = is_array($decoded['data'] ?? null) ? $decoded['data'] : [];
            $offset += count($batch);
            $countriesList = array_merge($countriesList, $batch);

            if (count($batch) === 0) {
                break;
            }
        }

        return [
            'ok' => true,
            'error' => null,
            'countries' => $countriesList,
            'total' => count($countriesList),
        ];
    }
}
