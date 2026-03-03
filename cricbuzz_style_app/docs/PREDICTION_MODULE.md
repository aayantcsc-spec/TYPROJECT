# Prediction Module Design (UI + Logic)

## Inputs
- Overs completed
- Wickets lost
- Current run rate
- Required run rate
- Target
- Batting first flag
- Powerplay strong flag

## Outputs
- Win probability percentage + animated bar
- Dynamic color mapping:
  - Green: high chance
  - Yellow: balanced
  - Red: low chance
- Momentum indicator message
- Pressure meter percentage
- Performance graph bars

## Rule-Based Logic (Simple)
Implemented in `assets/js/app.js`:

1. If `requiredRR > currentRR + 2` → reduce probability
2. If `wickets > 6` → sharp probability drop
3. If batting first + strong powerplay → probability increase
4. Additional heuristics for target and overs

## Pseudocode
```
if requiredRR > currentRR + 2:
    probability -= 18

if wickets > 6:
    probability -= 22

if battingFirst and powerplayStrong:
    probability += 14
```

## Upgrade Path (College Extension)
- Replace rules with trained model (Scikit-learn or XGBoost)
- Add API pipeline with Flask/Node backend
- Add real-time over-by-over feature updates
- Add model confidence interval and explainability panel
