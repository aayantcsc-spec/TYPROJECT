# Project Structure

```
cricbuzz_style_app/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── pages/
│   ├── match.html
│   ├── player.html
│   ├── team.html
│   ├── prediction.html
│   ├── series.html
│   └── points-table.html
└── docs/
    ├── PROJECT_STRUCTURE.md
    ├── UI_FEATURE_MATRIX.md
    └── PREDICTION_MODULE.md
```

## Layering
- `index.html`: Home layout (navigation + match categories + filters + content blocks)
- `pages/*`: Focus pages for each domain feature
- `assets/css/style.css`: Theme tokens, card system, tabs, tables, responsive rules
- `assets/js/app.js`: Theme, menu collapse, search/filter, bookmarks, tabs, prediction logic

## Mobile-First UX
- Collapsible menu for small viewports
- Horizontal swipeable tabs (`overflow-x`)
- Compact card grids become single column on mobile
