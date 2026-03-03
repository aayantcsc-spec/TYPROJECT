# Cricbuzz-Style Cricket App (UI-First)

This project is a **feature-focused, UI/UX-first cricket app prototype** inspired by Cricbuzz.
It intentionally emphasizes navigation, screen structure, visual hierarchy, responsive behavior, and prediction module flow.

## Stack Used
- Frontend: HTML, CSS, JavaScript
- Backend: Not required for this UI phase
- Prediction logic: Simple JavaScript model

## Included Features
- Match categories: Live, Recent, Upcoming
- Series overview and tournament page
- Match detail page with tabs: Live, Scorecard, Commentary, Stats, Lineups
- Player pages: profile, career stats, recent performance, style, ranking, comparison
- Team pages: profile, squad, form, head-to-head
- Prediction module UI + simple logic structure
- Dark/light mode
- Search + filters (Test/ODI/T20)
- Notification bell UI
- Bookmark favorite teams
- News & articles
- Match highlights
- Points table view

## How to Run
Open [index.html](index.html) directly in the browser.

If you want local server mode, run:

```bash
# from cricbuzz_style_app directory
python -m http.server 9090
```

Then open: `http://127.0.0.1:9090`

## Kaggle Cricket Players Dataset Integration

This app can ingest the Kaggle dataset you shared:

- Dataset: `zainhaidar/cricket-players-dataset`
- Loader script: [scripts/load_kaggle_players.py](scripts/load_kaggle_players.py)

### 1) Install dependency

```bash
pip install kagglehub[pandas-datasets] pandas
```

### 2) Run dataset export

```bash
# from cricbuzz_style_app directory
python scripts/load_kaggle_players.py
```

This generates:

- `data/cricket_players_dataset.json`

### 3) App usage

When this file exists, player statistics screens automatically use dataset values
(batting average, bowling average, strike rate, economy, role, batting/bowling style)
and merge them with live API player identity data.

If the file does not exist, the app falls back to API + built-in real-life roster.

## Project Structure
See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

## Prediction Module Notes
See [docs/PREDICTION_MODULE.md](docs/PREDICTION_MODULE.md)

## UI Design Notes
See [docs/UI_FEATURE_MATRIX.md](docs/UI_FEATURE_MATRIX.md)
