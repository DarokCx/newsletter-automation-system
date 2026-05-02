// Newsletter Automation System — Main Script
// Generates AI-powered newsletter content via Claude API
// Author: Erik Cadieux | Recursal.AI

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-opus-4-5';
const SCRIPT_PROPS = PropertiesService.getScriptProperties();

// ── Entry Points ──────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 Newsletter AI')
    .addItem('Ouvrir le panneau de contexte', 'openContextSidebar')
    .addItem('Calendrier éditorial', 'openCalendrierSidebar')
    .addSeparator()
    .addItem('⚙️ Configurer la clé API', 'setApiKey')
    .addToUi();
}

function openContextSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('ContextSidebar')
    .setTitle('Générateur de newsletter')
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

function openCalendrierSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('CalendrierSidebar')
    .setTitle('Calendrier éditorial')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── Data Loaders ──────────────────────────────────────────────────────────

function getBrands() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Personas');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const brands = [...new Set(data.slice(1).map(r => r[0]).filter(Boolean))];
  return brands;
}

function getPersonasByBrand(brand) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Personas');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const brandIdx = headers.indexOf('Marque');
  const nameIdx = headers.indexOf('Nom');
  const descIdx = headers.indexOf('Description');

  return data.slice(1)
    .filter(r => r[brandIdx] === brand)
    .map(r => ({ name: r[nameIdx], description: r[descIdx] }));
}

function getPilliersByBrand(brand) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Pilliers');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const brandIdx = headers.indexOf('Marque');
  const pillierIdx = headers.indexOf('Pillier');

  return data.slice(1)
    .filter(r => r[brandIdx] === brand)
    .map(r => r[pillierIdx])
    .filter(Boolean);
}

function getPartenairesList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Partenaires');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(r => r[0]).filter(Boolean);
}

// ── Content Generation ────────────────────────────────────────────────────

function generateNewsletter(params) {
  const { brand, persona, pillier, partenaire, date, notes } = params;
  const apiKey = SCRIPT_PROPS.getProperty('CLAUDE_API_KEY');

  if (!apiKey) {
    return { error: 'Clé API Claude manquante. Configurez-la via le menu ⚙️.' };
  }

  const prompt = buildPrompt({ brand, persona, pillier, partenaire, date, notes });

  try {
    const response = callClaudeAPI(apiKey, prompt);
    return parseNewsletterResponse(response);
  } catch (e) {
    return { error: `Erreur API: ${e.message}` };
  }
}

function buildPrompt({ brand, persona, pillier, partenaire, date, notes }) {
  return `Tu es un rédacteur expert en marketing coopératif québécois.

Génère un contenu de newsletter pour:
- Marque: ${brand}
- Persona cible: ${persona}
- Pilier de contenu: ${pillier}
- Partenaire mis en avant: ${partenaire || 'Aucun'}
- Date d'envoi: ${date || 'À définir'}
${notes ? `- Notes: ${notes}` : ''}

Génère le contenu dans ce format exact (JSON):
{
  "objet": "sujet de l'email (max 60 caractères)",
  "preheader": "texte de prévisualisation (max 90 caractères)",
  "accroche": "phrase d'accroche percutante",
  "introduction": "paragraphe d'introduction (3-4 phrases)",
  "offre": "description de l'offre ou de la valeur proposée",
  "cta": "texte du bouton d'appel à l'action"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

function callClaudeAPI(apiKey, prompt) {
  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CLAUDE_API_URL, options);
  const json = JSON.parse(response.getContentText());

  if (json.error) throw new Error(json.error.message);
  return json.content[0].text;
}

function parseNewsletterResponse(text) {
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return { error: 'Impossible de parser la réponse Claude.', raw: text };
  }
}

// ── Partner Normalization (Levenshtein) ───────────────────────────────────

function normalizePartenaire(input) {
  const partners = getPartenairesList();
  if (!input || partners.length === 0) return input;

  let best = input;
  let bestScore = Infinity;

  for (const p of partners) {
    const score = levenshtein(input.toLowerCase(), p.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return bestScore <= 3 ? best : input;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// ── Config ────────────────────────────────────────────────────────────────

function setApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Clé API Claude', 'Entrez votre clé API Anthropic:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() === ui.Button.OK) {
    SCRIPT_PROPS.setProperty('CLAUDE_API_KEY', result.getResponseText().trim());
    ui.alert('✅ Clé API sauvegardée.');
  }
}
