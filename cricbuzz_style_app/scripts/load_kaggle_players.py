import json
from pathlib import Path

import pandas as pd

try:
    import kagglehub
except ImportError as exc:
    raise SystemExit(
        "kagglehub is not installed. Run: pip install kagglehub[pandas-datasets]"
    ) from exc


DATASET = "zainhaidar/cricket-players-dataset"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "cricket_players_dataset.json"
SUPPORTED_EXTENSIONS = {
    ".csv",
    ".tsv",
    ".json",
    ".jsonl",
    ".parquet",
    ".feather",
    ".xls",
    ".xlsx",
    ".xlsm",
    ".xlsb",
}


def normalize_gender(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"female", "women", "w", "f"}:
        return "women"
    if text in {"male", "men", "m"}:
        return "men"
    return "unknown"


def pick_col(df: pd.DataFrame, *candidates: str):
    lowered = {c.lower(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in lowered:
            return lowered[candidate.lower()]
    return None


def choose_data_file(root: Path) -> Path:
    candidates = [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    if not candidates:
        raise SystemExit(f"No supported data files found in {root}")

    preferred = sorted(candidates, key=lambda p: (p.suffix.lower() not in {'.csv', '.parquet'}, -p.stat().st_size))
    return preferred[0]


def read_data_file(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()

    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t")
    if suffix == ".json":
        return pd.read_json(path)
    if suffix == ".jsonl":
        return pd.read_json(path, lines=True)
    if suffix == ".parquet":
        return pd.read_parquet(path)
    if suffix == ".feather":
        return pd.read_feather(path)
    if suffix in {".xls", ".xlsx", ".xlsm", ".xlsb"}:
        return pd.read_excel(path)

    raise SystemExit(f"Unsupported data file extension: {suffix}")


def main() -> None:
    dataset_dir = Path(kagglehub.dataset_download(DATASET))
    data_file = choose_data_file(dataset_dir)
    df = read_data_file(data_file)

    if not isinstance(df, pd.DataFrame) or df.empty:
        raise SystemExit("Dataset load failed or returned empty DataFrame")

    name_col = pick_col(df, "name", "player_name", "full_name")
    country_col = pick_col(df, "country", "nationality", "team")
    gender_col = pick_col(df, "gender", "sex", "category")
    batting_avg_col = pick_col(df, "batting_average", "bat_avg", "batting avg")
    bowling_avg_col = pick_col(df, "bowling_average", "bowl_avg", "bowling avg")
    strike_rate_col = pick_col(df, "strike_rate", "batting_strike_rate", "sr")
    economy_col = pick_col(df, "economy", "economy_rate")
    role_col = pick_col(df, "role", "playing_role")
    bat_style_col = pick_col(df, "batting_style", "bat_style")
    bowl_style_col = pick_col(df, "bowling_style", "bowl_style")

    if not name_col:
        raise SystemExit("Could not find player name column in dataset")

    records = []
    for idx, row in df.iterrows():
        name = str(row.get(name_col, "")).strip()
        if not name:
            continue

        gender = normalize_gender(row.get(gender_col, "")) if gender_col else "unknown"
        records.append(
            {
                "id": f"kaggle_{idx}",
                "name": name,
                "country": str(row.get(country_col, "N/A") if country_col else "N/A"),
                "gender": gender if gender in {"men", "women"} else "men",
                "source": "kaggle",
                "battingAverage": None if not batting_avg_col else row.get(batting_avg_col),
                "bowlingAverage": None if not bowling_avg_col else row.get(bowling_avg_col),
                "strikeRate": None if not strike_rate_col else row.get(strike_rate_col),
                "economy": None if not economy_col else row.get(economy_col),
                "role": None if not role_col else row.get(role_col),
                "battingStyle": None if not bat_style_col else row.get(bat_style_col),
                "bowlingStyle": None if not bowl_style_col else row.get(bowl_style_col),
            }
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2, default=str)

    print(f"Source file: {data_file}")
    print(f"Saved {len(records)} players to {OUTPUT}")


if __name__ == "__main__":
    main()
