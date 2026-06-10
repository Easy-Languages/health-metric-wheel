# Health Metric Wheel

A single-file Wheel of Life for Easy Languages team reviews. Punch in 7 category scores
(1–4) for a team and get a color-coded visual that shows the team's health at a glance.
Strong reads green, weak reads red.

## Run it
Open `index.html` in any browser. No build step, no dependencies, no server.

## Features
- **Four views**, toggleable from the tabs: Filled wheel, Hub & spokes, Cleaner radar,
  Horizontal bars. Each team remembers which view you last used.
- **Multiple teams.** Add / rename / delete teams from the toolbar. Each team keeps its
  own seven scores and its own preferred view. Teams are saved in the browser
  (localStorage), so they survive reloads.
- **Export.** "Download PNG" rasterizes the current chart (wheel, hub, or radar) with the
  team name and average baked in. "Save as PDF" uses the browser's print-to-PDF and works
  for every view, including the bars.
- **Backup.** "Download backup" writes all teams to a small JSON file; "Load backup"
  restores it. Use this to move data between browsers/machines or keep a durable copy,
  since localStorage is per-browser and clears if the cache is wiped.

## Edit categories or scoring
Everything lives in the `CONFIG` object at the top of the `<script>` in `index.html`:

```js
const CONFIG = {
  categories: [ "Content Quality", /* ...7 labels... */ ],
  scale: {
    1: { label: "Needs Attention", color: "#e5484d" },
    2: { label: "Developing",      color: "#f5a524" },
    3: { label: "Strong",          color: "#9bb83a" },
    4: { label: "Excellent",       color: "#3a9b5c" },
  },
};
```

- Change a category name → edit the `categories` array. The wheel relabels itself; no
  rebuild. (Cari's category list isn't final, so this is the intended way to update it.)
- Change the scale or colors → edit `scale`. The number of categories can change too;
  the chart adapts to however many are in the array.

## Context
- Build owner: Jae + Claude. Project home (brief, tasks, spec) lives in the Claude OS at
  `~/Claude/claude-os/Projects/2026-06-health-metric-wheel/`.
- Content owner: Cari (categories, key questions, scoring rubric).
- Canonical PRD: Notion page `e2040abad93c426d8333fed1250380a1`.

## Scope (v1)
7 scores in → one color-coded wheel out, screenshot-able for reviews. Parked for later:
per-category notes, two-cycle comparison, multi-team storage, export button, weighting.

