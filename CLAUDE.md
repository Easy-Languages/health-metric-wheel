# Easy Languages — Health Metric Wheel

## Project overview

Single browser tool for Easy Languages team health reviews. No build step,
no bundler, no dependencies. Plain HTML/CSS/JS, deployed on Vercel.
Reads live survey data from Google Forms via an Apps Script Web App.

## File structure

- `index.html`   — survey results: dual overlay comparison, 3 modes
- `js/config.js` — scale and colour tokens (`SCALE`, `TOKENS`, `MIN`, `MAX`)
- `js/wheel.js`  — SVG dual-overlay wheel renderer (`renderDualWheel`)
- `js/survey.js` — survey API client (`fetchTeams`, `fetchRounds`, `fetchScores`)
- `css/main.css` — all styles, shared across components

## Running the app

Open `index.html` directly in a browser — no server needed.

## Survey API

Google Apps Script Web App URL (read-only, no auth):
```
https://script.google.com/macros/s/AKfycbx_mKOkl1KNVE33Y_rPHtVRo8WR2CHxj1_mSwb8etPIFCzufoY6-j_v5oTbCPzHORWp/exec
```

Endpoints:
```
?action=teams   → { teams: ["Easy German", …] }
?action=rounds  → { rounds: ["2026-H1", …] }
?action=scores&team=Easy+German&round=2026-H1
  → { categories, teamMember: [n,…], reviewer: [n,…], respondents: {teamMember, reviewer} }
```

`categories` comes from the API response and is parallel to the score arrays.
The Apps Script is not in this repo — contact Jonathan if the URL changes.

## index.html — comparison modes (3 tabs)

1. **Self vs Reviewer** — same team + round, overlay `teamMember` vs `reviewer`
2. **Round vs Round** — same team + role, pick two rounds
3. **Team vs Team** — same round + role, pick two teams

Team tabs at the top are populated dynamically from `?action=teams`.
Both datasets render as overlapping filled wheel slices (distinct colours), with a score table and legend below.

## Scale

```
1 → Needs Attention  #e5484d
2 → Developing       #f5a524
3 → Strong           #9bb83a
4 → Excellent        #3a9b5c
```

## Design tokens

```
--bg: #fbfaf8   --ink: #2b2b2b   --muted: #777   --line: #e3e0db   --card: #fff
```

## Code conventions

- No ES modules — files loaded via `<script src="…">` in order:
  `config.js → wheel.js → survey.js → page inline script`
- `wheel.js` exposes: `renderDualWheel(container, scoresA, scoresB, cats, colorA, colorB)`
- `survey.js` exposes: `fetchTeams()`, `fetchRounds()`, `fetchScores(team, round)`
- `config.js` exposes: `SCALE`, `TOKENS`, `MIN`, `MAX` as plain consts
- All hex colours come from `SCALE[n].color` or CSS custom props — never hardcoded elsewhere

## Owner

Jonathan — head of tech, Easy Languages GmbH, Berlin.
Ping if categories, questions, or the survey API URL change.
