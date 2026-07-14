/**
 * Easy Languages — Health Survey · Data Web App
 * -----------------------------------------------
 * Bound to the Google Sheet that collects form responses.
 *
 * HOW TO DEPLOY:
 * 1. Open the response spreadsheet → Extensions → Apps Script
 * 2. Paste this file, replacing any existing code
 * 3. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone  (or "Anyone with Google account" if you prefer)
 * 4. Copy the Web app URL — paste it into the wheel tool as SURVEY_API_URL
 *
 * ENDPOINTS:
 *
 *   GET ?action=rounds
 *   → { rounds: ["2026-H1", "2025-H2", …] }   sorted newest first
 *
 *   GET ?action=teams
 *   → { teams: ["Easy German", "Easy Spanish", …] }   sorted alphabetically
 *
 *   GET ?action=scores&team=Easy+German&round=2026-H1
 *   → {
 *       team: "Easy German",
 *       round: "2026-H1",
 *       categories: ["Content", "Systems & Execution", …],
 *       teamMember: [3.2, 2.8, 3.5, 2.0, 3.8, 2.5, 3.1],   // avg per category, or null
 *       reviewer:   [3.0, 3.2, 3.0, 2.5, 3.5, 3.0, 2.8],   // avg per category, or null
 *       respondents: { teamMember: 4, reviewer: 1 },
 *       questions: [                                       // one entry per form question
 *         { category: "Content", label: "We are producing high-quality audio, and visu…",
 *           teamMember: 3.2, reviewer: 3.0 },
 *         …
 *       ]
 *     }
 *
 *   Question labels are read live from row 1 of the sheet (the form's question text),
 *   not hardcoded — if the form wording changes, this updates automatically.
 *
 *   GET ?action=scores&team=Easy+German&round=2026-H1&role=Team+Member
 *   → same shape but reviewer is null (single-role filter)
 */

// ── Column layout ────────────────────────────────────────────────────────────
// Google Forms appends columns in submission order. The first column is always
// "Timestamp". The rest match the order questions appear in the form.
// Update these offsets if you ever reorder the form questions.

const COL = {
  timestamp: 0,  // A
  team:      1,  // B
  round:     2,  // C
  role:      3,  // D  "Team Member" | "Reviewer"

  // Content (5 questions)
  content: [4, 5, 6, 7, 8],

  // Systems & Execution (4 questions)
  systems: [9, 10, 11, 12],

  // Educational Value (5 questions)
  educational: [13, 14, 15, 16, 17],

  // Audience Growth & Marketing (4 questions)
  growth: [18, 19, 20, 21],

  // Community & Brand (4 questions)
  community: [22, 23, 24, 25],

  // Business & Strategy (4 questions)
  business: [26, 27, 28, 29],

  // Team (4 questions)
  team_qs: [30, 31, 32, 33],
};

const CATEGORIES = [
  { key: "content",     label: "Content" },
  { key: "systems",     label: "Systems & Execution" },
  { key: "educational", label: "Educational Value" },
  { key: "growth",      label: "Audience Growth & Marketing" },
  { key: "community",   label: "Community & Brand" },
  { key: "business",    label: "Business & Strategy" },
  { key: "team_qs",     label: "Team" },
];

// ── Main entry point ─────────────────────────────────────────────────────────

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "scores";

  let result;
  try {
    if (action === "rounds") {
      result = getRounds();
    } else if (action === "teams") {
      result = getTeams();
    } else if (action === "scores") {
      const team  = params.team  || null;
      const round = params.round || null;
      const role  = params.role  || null;  // optional filter
      if (!team || !round) {
        result = { error: "missing_params", message: "Provide team and round." };
      } else {
        result = getScores(team, round, role);
      }
    } else {
      result = { error: "unknown_action" };
    }
  } catch (err) {
    result = { error: "server_error", message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSheet() {
  // Uses the first sheet in the bound spreadsheet (the form response sheet).
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function getRows() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  return data.slice(1); // drop header row
}

function getHeaders() {
  const sheet = getSheet();
  return sheet.getDataRange().getValues()[0];
}

function avg(values) {
  // values is an array of numbers (already validated as numeric).
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function categoryAvgForRow(row, key) {
  // Average the question columns for one category from one response row.
  const cols = COL[key];
  const vals = cols.map(c => Number(row[c])).filter(v => v >= 1 && v <= 4);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function questionAvg(rows, col) {
  // Average one question column across a set of response rows.
  const vals = rows.map(r => Number(r[col])).filter(v => v >= 1 && v <= 4);
  return avg(vals);
}

// ── Action handlers ──────────────────────────────────────────────────────────

function getRounds() {
  const rows   = getRows();
  const rounds = [...new Set(rows.map(r => String(r[COL.round]).trim()).filter(Boolean))];
  rounds.sort((a, b) => b.localeCompare(a)); // newest first
  return { rounds };
}

function getTeams() {
  const rows  = getRows();
  const teams = [...new Set(rows.map(r => String(r[COL.team]).trim()).filter(Boolean))];
  teams.sort();
  return { teams };
}

function buildQuestions(headers, tmRows, revRows) {
  // One entry per form question, labeled from the sheet's own header row.
  const questions = [];
  CATEGORIES.forEach(cat => {
    COL[cat.key].forEach(col => {
      questions.push({
        category:   cat.label,
        label:      String(headers[col] || "").trim(),
        teamMember: questionAvg(tmRows, col),
        reviewer:   questionAvg(revRows, col),
      });
    });
  });
  return questions;
}

function getScores(team, round, roleFilter) {
  const rows    = getRows();
  const headers = getHeaders();

  // Filter to this team + round (case-insensitive trim)
  const match = rows.filter(r =>
    String(r[COL.team]).trim().toLowerCase()  === team.trim().toLowerCase() &&
    String(r[COL.round]).trim().toLowerCase() === round.trim().toLowerCase()
  );

  // Split by role
  const byRole = { "Team Member": [], "Reviewer": [] };
  match.forEach(r => {
    const role = String(r[COL.role]).trim();
    if (byRole[role]) byRole[role].push(r);
  });

  // For each role, compute per-category averages across all respondents
  function roleScores(rows) {
    if (!rows.length) return null;
    return CATEGORIES.map(cat => {
      // One value per respondent for this category (average of that category's questions)
      const perRespondent = rows.map(r => categoryAvgForRow(r, cat.key)).filter(v => v !== null);
      return avg(perRespondent);
    });
  }

  const tmRows  = roleFilter === "Reviewer"    ? [] : byRole["Team Member"];
  const revRows = roleFilter === "Team Member" ? [] : byRole["Reviewer"];

  return {
    team,
    round,
    categories:  CATEGORIES.map(c => c.label),
    teamMember:  roleScores(tmRows),
    reviewer:    roleScores(revRows),
    respondents: {
      teamMember: tmRows.length,
      reviewer:   revRows.length,
    },
    questions: buildQuestions(headers, tmRows, revRows),
  };
}