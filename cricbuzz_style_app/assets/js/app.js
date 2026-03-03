const root = document.documentElement;
const CRIC_API_KEY = '4066b45f-9790-421d-bf61-0908ae31ec69';
const CRIC_API_BASE_URL = 'https://api.cricapi.com/v1';
const predictionStore = {
  series: [],
  matches: [],
};
const FANTASY_TEAMS_KEY = 'cricview_fantasy_teams';
const kaggleDatasetStore = {
  loaded: false,
  players: [],
  byName: new Map(),
};
const REAL_LIFE_CRICKETERS = {
  men: [
    { name: 'Virat Kohli', country: 'India' },
    { name: 'Rohit Sharma', country: 'India' },
    { name: 'Jasprit Bumrah', country: 'India' },
    { name: 'Babar Azam', country: 'Pakistan' },
    { name: 'Shaheen Afridi', country: 'Pakistan' },
    { name: 'Kane Williamson', country: 'New Zealand' },
    { name: 'Trent Boult', country: 'New Zealand' },
    { name: 'Joe Root', country: 'England' },
    { name: 'Ben Stokes', country: 'England' },
    { name: 'Steve Smith', country: 'Australia' },
    { name: 'Pat Cummins', country: 'Australia' },
    { name: 'Quinton de Kock', country: 'South Africa' },
  ],
  women: [
    { name: 'Smriti Mandhana', country: 'India' },
    { name: 'Harmanpreet Kaur', country: 'India' },
    { name: 'Shafali Verma', country: 'India' },
    { name: 'Ellyse Perry', country: 'Australia' },
    { name: 'Meg Lanning', country: 'Australia' },
    { name: 'Alyssa Healy', country: 'Australia' },
    { name: 'Heather Knight', country: 'England' },
    { name: 'Nat Sciver-Brunt', country: 'England' },
    { name: 'Sophie Ecclestone', country: 'England' },
    { name: 'Sana Mir', country: 'Pakistan' },
    { name: 'Nida Dar', country: 'Pakistan' },
    { name: 'Sophie Devine', country: 'New Zealand' },
  ],
};

function setTheme(theme) {
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  setTheme(localStorage.getItem('theme') || 'dark');
}

function initMenuToggle() {
  const btn = document.querySelector('#menuToggle');
  const menu = document.querySelector('#topMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
}

function initSearchFilter() {
  const search = document.querySelector('#globalSearch');
  if (!search) return;
  search.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('[data-search]').forEach((el) => {
      const text = el.getAttribute('data-search')?.toLowerCase() || '';
      el.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

function initFormatFilter() {
  const select = document.querySelector('#formatFilter');
  if (!select) return;
  select.addEventListener('change', (e) => {
    const value = e.target.value;
    document.querySelectorAll('[data-format]').forEach((el) => {
      const format = el.getAttribute('data-format');
      el.style.display = value === 'All' || value === format ? '' : 'none';
    });
  });
}

function initBookmarks() {
  document.querySelectorAll('.bookmark').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach((tabsEl) => {
    const tabs = tabsEl.querySelectorAll('.tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        const wrapper = tab.closest('[data-tabs-wrapper]') || document;
        wrapper.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        wrapper.querySelectorAll('[data-tab-panel]').forEach((panel) => {
          panel.style.display = panel.id === targetId ? '' : 'none';
        });
      });
    });
  });
}

function calculateWinProbability({ overs, wickets, currentRR, requiredRR, target, battingFirst, powerplayStrong }) {
  let probability = 50;

  if (requiredRR > currentRR + 2) probability -= 18;
  if (wickets > 6) probability -= 22;
  if (battingFirst && powerplayStrong) probability += 14;

  if (target >= 180) probability -= 6;
  if (overs > 15) probability += 4;

  probability = Math.max(0, Math.min(100, probability));
  return probability;
}

function probabilityColor(value) {
  if (value >= 65) return 'var(--accent)';
  if (value >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

function hashSeed(text) {
  return [...String(text || 'seed')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function inferModelInputsFromMatch(match) {
  const seed = hashSeed(match.id || `${match.t1}-${match.t2}`);
  const matchType = String(match.matchType || '').toLowerCase();

  const overs = matchType === 'test' ? 55 : matchType === 'odi' ? 32 : 14;
  const wickets = seed % 8;
  const currentRR = Number((5.5 + (seed % 40) / 10).toFixed(1));
  const requiredRR = Number((6 + (seed % 45) / 10).toFixed(1));
  const target = matchType === 'test' ? 320 : matchType === 'odi' ? 275 : 185;
  const battingFirst = seed % 2 === 0;
  const powerplayStrong = seed % 3 !== 0;

  return { overs, wickets, currentRR, requiredRR, target, battingFirst, powerplayStrong };
}

function extractTeams(matches) {
  const set = new Set();
  matches.forEach((match) => {
    if (Array.isArray(match.teams)) {
      match.teams.forEach((team) => team && set.add(team));
    }
    if (match.t1) set.add(match.t1);
    if (match.t2) set.add(match.t2);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

function getTournamentMatches(tournamentId) {
  if (!predictionStore.matches.length) return [];
  if (!tournamentId || tournamentId === 'all') return predictionStore.matches;
  return predictionStore.matches.filter((match) => String(match.series_id || '') === String(tournamentId));
}

function fillTeamSelect(selectEl, teams, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${placeholder}</option>` + teams.map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`).join('');
}

function renderTournamentPredictions(matches) {
  const container = document.querySelector('#tournamentPredictions');
  const info = document.querySelector('#tournamentPredictionInfo');
  if (!container) return;

  if (!matches.length) {
    container.innerHTML = '<article class="card"><p class="muted">No matches found for selected tournament.</p></article>';
    if (info) info.textContent = 'No fixtures currently available for this tournament.';
    return;
  }

  const blocks = matches.slice(0, 18).map((match) => {
    const values = inferModelInputsFromMatch(match);
    const teamAProbability = calculateWinProbability(values);
    const teamBProbability = 100 - teamAProbability;
    const color = probabilityColor(teamAProbability);
    const teamA = match.t1 || (match.teams && match.teams[0]) || 'Team A';
    const teamB = match.t2 || (match.teams && match.teams[1]) || 'Team B';
    const series = match.series || 'Tournament';

    return `
      <article class="card" data-search="${escapeHtml(`${teamA} ${teamB} ${series}`)}" data-format="${escapeHtml(String(match.matchType || 'N/A').toUpperCase())}">
        <div class="card-top"><span class="badge">PREDICTION</span><span class="badge">${escapeHtml(String(match.matchType || 'N/A').toUpperCase())}</span></div>
        <h4>${escapeHtml(teamA)} vs ${escapeHtml(teamB)}</h4>
        <p class="muted">${escapeHtml(series)}</p>
        <div class="progress-wrap"><div class="progress-bar" style="width:${teamAProbability}%; background:${color};"></div></div>
        <p class="muted">${escapeHtml(teamA)}: ${teamAProbability}% · ${escapeHtml(teamB)}: ${teamBProbability}%</p>
      </article>
    `;
  });

  container.innerHTML = blocks.join('');
  if (info) info.textContent = `Generated predictions for ${Math.min(matches.length, 18)} matches.`;
}

async function initPredictionDataSources() {
  const tournamentGenderFilter = document.querySelector('#tournamentGenderFilter');
  const tournamentSelect = document.querySelector('#tournamentSelect');
  const teamASelect = document.querySelector('#teamASelect');
  const teamBSelect = document.querySelector('#teamBSelect');
  if (!tournamentSelect || !teamASelect || !teamBSelect) return;

  const renderTournamentOptions = (gender = 'all') => {
    const filteredSeries = predictionStore.series.filter((item) => gender === 'all' || item.gender === gender);
    const options = filteredSeries
      .map((item) => `<option value="${escapeHtml(item.id || '')}">${escapeHtml(item.name || 'Unknown Tournament')} · ${tournamentGenderLabel(item.gender)}</option>`)
      .join('');

    tournamentSelect.innerHTML = '<option value="all">All Tournaments</option>' + options;
  };

  try {
    const [series, matches, liveMatches] = await Promise.all([
      fetchCricApi('series', { offset: 0 }),
      fetchCricApi('matches', { offset: 0 }),
      fetchCricApi('cricScore', { offset: 0 }),
    ]);

    predictionStore.series = enrichSeriesWithGender(series);
    predictionStore.matches = [...matches, ...liveMatches];

    renderTournamentOptions(tournamentGenderFilter?.value || 'all');

    const allTeams = extractTeams(predictionStore.matches);
    fillTeamSelect(teamASelect, allTeams, 'Select Team A');
    fillTeamSelect(teamBSelect, allTeams, 'Select Team B');
    renderTournamentPredictions(predictionStore.matches);
  } catch (error) {
    const info = document.querySelector('#tournamentPredictionInfo');
    if (info) info.textContent = `Failed to load tournaments/teams: ${error.message}`;
  }

  tournamentSelect.addEventListener('change', () => {
    const selectedTournament = tournamentSelect.value;
    const filteredMatches = getTournamentMatches(selectedTournament);
    const filteredTeams = extractTeams(filteredMatches);
    fillTeamSelect(teamASelect, filteredTeams.length ? filteredTeams : extractTeams(predictionStore.matches), 'Select Team A');
    fillTeamSelect(teamBSelect, filteredTeams.length ? filteredTeams : extractTeams(predictionStore.matches), 'Select Team B');
  });

  tournamentGenderFilter?.addEventListener('change', () => {
    renderTournamentOptions(tournamentGenderFilter.value || 'all');
    const selectedTournament = tournamentSelect.value;
    const filteredMatches = getTournamentMatches(selectedTournament);
    const filteredTeams = extractTeams(filteredMatches);
    fillTeamSelect(teamASelect, filteredTeams.length ? filteredTeams : extractTeams(predictionStore.matches), 'Select Team A');
    fillTeamSelect(teamBSelect, filteredTeams.length ? filteredTeams : extractTeams(predictionStore.matches), 'Select Team B');
  });
}

function initPredictionModule() {
  const form = document.querySelector('#predictionForm');
  if (!form) return;

  const output = document.querySelector('#winProbabilityValue');
  const teamWinSplit = document.querySelector('#teamWinSplit');
  const bar = document.querySelector('#winProbabilityBar');
  const momentumText = document.querySelector('#momentumText');
  const pressureValue = document.querySelector('#pressureMeterValue');
  const momentumBars = document.querySelectorAll('.spark[data-momentum]');
  const context = document.querySelector('#predictionContext');
  const tournamentSelect = document.querySelector('#tournamentSelect');
  const teamASelect = document.querySelector('#teamASelect');
  const teamBSelect = document.querySelector('#teamBSelect');
  const autoFillBtn = document.querySelector('#autoFillLiveBtn');
  const runTournamentBtn = document.querySelector('#runTournamentBtn');

  const runPrediction = (values) => {
    const teamAProbability = calculateWinProbability(values);
    const teamBProbability = 100 - teamAProbability;
    const color = probabilityColor(teamAProbability);
    const teamAName = teamASelect?.value || 'Team A';
    const teamBName = teamBSelect?.value || 'Team B';

    output.textContent = `${teamAProbability}%`;
    bar.style.width = `${teamAProbability}%`;
    bar.style.background = color;
    if (teamWinSplit) {
      teamWinSplit.textContent = `${teamAName}: ${teamAProbability}% · ${teamBName}: ${teamBProbability}%`;
    }

    const pressure = Math.max(0, Math.min(100, Math.round((values.requiredRR - values.currentRR + values.wickets / 2) * 10 + 40)));
    pressureValue.textContent = `${pressure}%`;

    if (pressure >= 70) momentumText.textContent = 'High pressure phase · Turning point likely';
    else if (pressure >= 45) momentumText.textContent = 'Balanced momentum · Match open';
    else momentumText.textContent = 'Low pressure phase · Control with batting side';

    momentumBars.forEach((barEl, idx) => {
      const randomShift = Math.floor(Math.random() * 18) - 9;
      const base = Math.max(16, Math.min(100, teamAProbability + randomShift - idx * 3));
      barEl.style.height = `${base}%`;
      barEl.style.background = color;
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const values = {
      overs: Number(document.querySelector('#overs').value),
      wickets: Number(document.querySelector('#wickets').value),
      currentRR: Number(document.querySelector('#currentRR').value),
      requiredRR: Number(document.querySelector('#requiredRR').value),
      target: Number(document.querySelector('#target').value),
      battingFirst: document.querySelector('#battingFirst').checked,
      powerplayStrong: document.querySelector('#powerplayStrong').checked,
    };

    runPrediction(values);

    const teamA = teamASelect?.value || 'Team A';
    const teamB = teamBSelect?.value || 'Team B';
    const tournamentName = tournamentSelect?.selectedOptions?.[0]?.textContent || 'All Tournaments';
    if (context) context.textContent = `Prediction Context: ${teamA} vs ${teamB} · ${tournamentName}`;
  });

  if (autoFillBtn) {
    autoFillBtn.addEventListener('click', () => {
      const teamA = teamASelect?.value;
      const teamB = teamBSelect?.value;
      const selectedTournament = tournamentSelect?.value || 'all';
      const scopeMatches = getTournamentMatches(selectedTournament);

      const picked = scopeMatches.find((m) => {
        const t1 = m.t1 || (m.teams && m.teams[0]);
        const t2 = m.t2 || (m.teams && m.teams[1]);
        if (teamA && teamB) return t1 === teamA && t2 === teamB;
        return true;
      }) || scopeMatches[0];

      if (!picked) {
        if (context) context.textContent = 'No live/tournament match available for auto-fill.';
        return;
      }

      const values = inferModelInputsFromMatch(picked);
      document.querySelector('#overs').value = values.overs;
      document.querySelector('#wickets').value = values.wickets;
      document.querySelector('#currentRR').value = values.currentRR;
      document.querySelector('#requiredRR').value = values.requiredRR;
      document.querySelector('#target').value = values.target;
      document.querySelector('#battingFirst').checked = values.battingFirst;
      document.querySelector('#powerplayStrong').checked = values.powerplayStrong;

      if (teamASelect && !teamASelect.value && (picked.t1 || (picked.teams && picked.teams[0]))) {
        teamASelect.value = picked.t1 || picked.teams[0];
      }
      if (teamBSelect && !teamBSelect.value && (picked.t2 || (picked.teams && picked.teams[1]))) {
        teamBSelect.value = picked.t2 || picked.teams[1];
      }

      runPrediction(values);
      if (context) context.textContent = `Auto-filled from match: ${(picked.t1 || picked.teams?.[0] || 'Team A')} vs ${(picked.t2 || picked.teams?.[1] || 'Team B')}`;
    });
  }

  if (runTournamentBtn) {
    runTournamentBtn.addEventListener('click', () => {
      const selectedTournament = tournamentSelect?.value || 'all';
      const filteredMatches = getTournamentMatches(selectedTournament);
      renderTournamentPredictions(filteredMatches);

      const tournamentName = tournamentSelect?.selectedOptions?.[0]?.textContent || 'All Tournaments';
      if (context) context.textContent = `Tournament run complete for: ${tournamentName}`;
    });
  }
}

async function fetchCricApi(endpoint, params = {}) {
  const query = new URLSearchParams({ apikey: CRIC_API_KEY, ...params });
  const response = await fetch(`${CRIC_API_BASE_URL}/${endpoint}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  const payload = await response.json();
  if (payload.status !== 'success') {
    throw new Error(payload.info || 'CricAPI returned non-success status');
  }
  return Array.isArray(payload.data) ? payload.data : [];
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim();
}

function getStoredFantasyTeams() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FANTASY_TEAMS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFantasyTeams(teams) {
  localStorage.setItem(FANTASY_TEAMS_KEY, JSON.stringify(teams));
}

function computeTeamScore(team) {
  const hash = hashSeed(`${team.name}-${team.tournament}-${team.players?.join('|')}`);
  const playerBonus = (team.players?.length || 0) * 8;
  const captainBonus = team.captain ? 25 : 0;
  const viceCaptainBonus = team.viceCaptain ? 12 : 0;
  return 120 + (hash % 180) + playerBonus + captainBonus + viceCaptainBonus;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeKagglePlayer(raw, index = 0) {
  const id = raw.id || `kaggle_${index}`;
  const name = String(raw.name || '').trim();
  if (!name) return null;

  const genderText = String(raw.gender || '').toLowerCase();
  const gender = genderText.includes('women') || genderText.includes('female') ? 'women' : 'men';

  return {
    id,
    name,
    country: raw.country || 'N/A',
    gender,
    source: 'kaggle',
    battingAverage: toNumberOrNull(raw.battingAverage),
    bowlingAverage: toNumberOrNull(raw.bowlingAverage),
    strikeRate: toNumberOrNull(raw.strikeRate),
    economy: toNumberOrNull(raw.economy),
    role: raw.role || null,
    battingStyle: raw.battingStyle || null,
    bowlingStyle: raw.bowlingStyle || null,
  };
}

async function loadKagglePlayersDataset() {
  if (kaggleDatasetStore.loaded) return kaggleDatasetStore.players;

  const candidates = [
    '../data/cricket_players_dataset.json',
    './data/cricket_players_dataset.json',
    '../data/cricket_players_dataset.sample.json',
    './data/cricket_players_dataset.sample.json',
  ];

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) continue;

      const payload = await response.json();
      if (!Array.isArray(payload)) continue;

      const normalized = payload
        .map((player, index) => normalizeKagglePlayer(player, index))
        .filter(Boolean);

      kaggleDatasetStore.players = normalized;
      kaggleDatasetStore.byName = new Map(normalized.map((player) => [player.name.toLowerCase(), player]));
      kaggleDatasetStore.loaded = true;
      return normalized;
    } catch {
      continue;
    }
  }

  kaggleDatasetStore.loaded = true;
  kaggleDatasetStore.players = [];
  kaggleDatasetStore.byName = new Map();
  return [];
}

function formatStat(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(digits);
}

function getRealLifePlayers() {
  const men = REAL_LIFE_CRICKETERS.men.map((player) => ({
    id: `real_men_${player.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: player.name,
    country: player.country,
    gender: 'men',
    source: 'real-life',
  }));

  const women = REAL_LIFE_CRICKETERS.women.map((player) => ({
    id: `real_women_${player.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: player.name,
    country: player.country,
    gender: 'women',
    source: 'real-life',
  }));

  return [...men, ...women];
}

function inferGenderByName(name = '') {
  const text = String(name).toLowerCase();
  if (REAL_LIFE_CRICKETERS.women.some((p) => p.name.toLowerCase() === text)) return 'women';
  if (REAL_LIFE_CRICKETERS.men.some((p) => p.name.toLowerCase() === text)) return 'men';
  return 'men';
}

function classifyTournamentGender(name = '') {
  const text = String(name || '').toLowerCase();
  const womenKeywords = ['women', 'women\'s', 'wpl', 'wbbl', 'wwc', 'female'];
  return womenKeywords.some((keyword) => text.includes(keyword)) ? 'women' : 'men';
}

function tournamentGenderLabel(gender) {
  return gender === 'women' ? 'Female Tournament' : 'Male Tournament';
}

function enrichSeriesWithGender(series = []) {
  return series.map((item) => {
    const gender = classifyTournamentGender(item.name || '');
    return { ...item, gender };
  });
}

function mergePlayersWithRealLife(apiPlayers = [], kagglePlayers = []) {
  const map = new Map();
  const realPlayers = getRealLifePlayers();

  realPlayers.forEach((player) => {
    map.set(player.name.toLowerCase(), player);
  });

  kagglePlayers.forEach((player) => {
    map.set(player.name.toLowerCase(), {
      ...player,
      source: 'kaggle',
    });
  });

  apiPlayers.forEach((player) => {
    const key = String(player.name || '').toLowerCase();
    if (!key) return;

    const existing = map.get(key);
    map.set(key, {
      id: player.id || existing?.id || `api_${key.replace(/[^a-z0-9]+/g, '_')}`,
      name: player.name,
      country: player.country || existing?.country || 'N/A',
      gender: existing?.gender || inferGenderByName(player.name),
      source: 'api',
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function filterPlayersByGender(players, gender) {
  if (!gender || gender === 'all') return players;
  return players.filter((player) => player.gender === gender);
}

async function initPlayerStatisticsPage() {
  const playerSelect = document.querySelector('#playerSelect');
  if (!playerSelect) return;

  const genderFilter = document.querySelector('#playerGenderFilter');
  const loadBtn = document.querySelector('#loadPlayerStatsBtn');
  const statsBody = document.querySelector('#playerStatsBody');
  const headerInfo = document.querySelector('#playerHeaderInfo');
  const recentPerformance = document.querySelector('#playerRecentPerformance');
  const styles = document.querySelector('#playerStyles');
  const rankingList = document.querySelector('#playerRankingList');

  let players = [];

  const fillPlayerSelect = () => {
    const filtered = filterPlayersByGender(players, genderFilter?.value || 'all');
    playerSelect.innerHTML = '<option value="">Select a player</option>' + filtered
      .slice(0, 200)
      .map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)} (${escapeHtml(player.country || 'N/A')})</option>`)
      .join('');

    if (rankingList) {
      const top = filtered.slice(0, 10);
      rankingList.innerHTML = top.length
        ? top.map((p, idx) => `<li>#${idx + 1} ${escapeHtml(p.name)} · ${escapeHtml(p.country || 'N/A')} · ${escapeHtml(p.gender === 'women' ? 'Women' : 'Men')}</li>`).join('')
        : '<li class="muted">No players for selected filter.</li>';
    }
  };

  try {
    const apiPlayers = await fetchCricApi('players', { offset: 0 });
    players = mergePlayersWithRealLife(apiPlayers, []);
    fillPlayerSelect();
  } catch (error) {
    if (headerInfo) headerInfo.textContent = `Failed to load players: ${error.message}`;
    return;
  }

  const renderPlayer = async () => {
    const playerId = playerSelect.value;
    if (!playerId) {
      statsBody.innerHTML = '<tr><td colspan="2" class="muted">No player selected.</td></tr>';
      return;
    }

    const selected = players.find((p) => p.id === playerId) || {};
    let detailed = {};

    if (!String(playerId).startsWith('real_')) {
      try {
        const response = await fetch(`${CRIC_API_BASE_URL}/players_info?${new URLSearchParams({ apikey: CRIC_API_KEY, id: playerId }).toString()}`);
        const payload = await response.json();
        if (payload.status === 'success' && payload.data) {
          detailed = payload.data;
        }
      } catch {
        detailed = {};
      }
    }

    const infoRows = [
      ['Name', selected.name || detailed.name || 'N/A'],
      ['Country', selected.country || detailed.country || 'N/A'],
      ['Category', selected.gender === 'women' ? 'Women Cricketer' : 'Men Cricketer'],
      ['Batting Average', formatStat(detailed.battingAverage) || 'N/A (not provided by live API plan)'],
      ['Bowling Average', formatStat(detailed.bowlingAverage) || 'N/A (not provided by live API plan)'],
      ['Strike Rate', formatStat(detailed.strikeRate) || 'N/A (not provided by live API plan)'],
      ['Economy', formatStat(detailed.economy) || 'N/A (not provided by live API plan)'],
      ['Role', detailed.role || 'N/A'],
      ['Live Updated', new Date().toLocaleString()],
    ];

    statsBody.innerHTML = infoRows
      .map(([metric, value]) => `<tr><td>${escapeHtml(metric)}</td><td>${escapeHtml(value)}</td></tr>`)
      .join('');

    if (headerInfo) headerInfo.textContent = `${selected.name || 'Player'} · ${selected.country || 'Unknown'} · Real-time profile loaded from live API.`;
    if (recentPerformance) recentPerformance.textContent = 'Recent Performance: Real-time API profile loaded. Advanced batting/bowling aggregates appear when provided by API access tier.';
    if (styles) {
      const styleSeed = hashSeed(selected.name || playerId);
      const battingStyle = detailed.battingStyle || (styleSeed % 2 === 0 ? 'Right-hand Bat' : 'Left-hand Bat');
      const bowlingStyle = detailed.bowlingStyle || (styleSeed % 3 === 0 ? 'Right-arm Pace' : styleSeed % 3 === 1 ? 'Right-arm Spin' : 'Left-arm Spin');
      styles.textContent = `Batting: ${battingStyle} · Bowling: ${bowlingStyle}`;
    }
  };

  if (loadBtn) loadBtn.addEventListener('click', renderPlayer);
  genderFilter?.addEventListener('change', () => {
    fillPlayerSelect();
    statsBody.innerHTML = '<tr><td colspan="2" class="muted">Select a player from the updated list.</td></tr>';
  });
  playerSelect.addEventListener('change', renderPlayer);
}

async function initTeamManagement() {
  const form = document.querySelector('#fantasyTeamForm');
  if (!form) return;

  const tournamentSelect = document.querySelector('#fantasyTournamentSelect');
  const tournamentGenderSelect = document.querySelector('#fantasyTournamentGender');
  const captainSelect = document.querySelector('#fantasyCaptainSelect');
  const viceCaptainSelect = document.querySelector('#fantasyViceCaptainSelect');
  const playerPool = document.querySelector('#playerPool');
  const teamsContainer = document.querySelector('#myFantasyTeams');
  const searchInput = document.querySelector('#playerPoolSearch');
  const genderFilter = document.querySelector('#fantasyGenderFilter');
  const teamNameInput = document.querySelector('#fantasyTeamName');

  let players = [];
  let selectedPlayers = new Set();
  let tournaments = [];
  const kagglePlayers = await loadKagglePlayersDataset();

  const renderTournamentOptions = (gender = 'all') => {
    const filtered = tournaments.filter((item) => gender === 'all' || item.gender === gender);
    tournamentSelect.innerHTML = '<option value="all">All Tournaments</option>' + filtered
      .map((s) => `<option value="${escapeHtml(s.id || '')}">${escapeHtml(s.name || 'Unknown')} · ${tournamentGenderLabel(s.gender)}</option>`)
      .join('');
  };

  const renderTeams = () => {
    const teams = getStoredFantasyTeams();
    if (!teams.length) {
      teamsContainer.innerHTML = '<article class="card"><p class="muted">No fantasy teams yet. Create your first team.</p></article>';
      return;
    }

    teamsContainer.innerHTML = teams.map((team) => `
      <article class="card">
        <h4>${escapeHtml(team.name)}</h4>
        <p class="muted">Tournament: ${escapeHtml(team.tournamentName || 'All Tournaments')}</p>
        <p class="muted">Players: ${team.players.length} · Captain: ${escapeHtml(team.captain || 'N/A')} · Vice-Captain: ${escapeHtml(team.viceCaptain || 'N/A')}</p>
        <p class="muted">Score: ${computeTeamScore(team)}</p>
        <button class="btn" data-delete-team="${escapeHtml(team.id)}">Delete Team</button>
      </article>
    `).join('');

    teamsContainer.querySelectorAll('[data-delete-team]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-team');
        const remaining = getStoredFantasyTeams().filter((team) => team.id !== id);
        saveFantasyTeams(remaining);
        renderTeams();
      });
    });
  };

  const renderPlayerPool = (query = '') => {
    const q = query.toLowerCase().trim();
    const gender = genderFilter?.value || 'all';
    const filtered = filterPlayersByGender(players, gender)
      .filter((p) => `${p.name} ${p.country}`.toLowerCase().includes(q))
      .slice(0, 120);

    playerPool.innerHTML = filtered.map((player) => `
      <label class="card" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" data-player-id="${escapeHtml(player.id)}" ${selectedPlayers.has(player.id) ? 'checked' : ''} />
        <span>${escapeHtml(player.name)} (${escapeHtml(player.country || 'N/A')}) · ${escapeHtml(player.gender === 'women' ? 'Women' : 'Men')}</span>
      </label>
    `).join('');

    playerPool.querySelectorAll('[data-player-id]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = checkbox.getAttribute('data-player-id');
        if (checkbox.checked) selectedPlayers.add(id);
        else selectedPlayers.delete(id);

        const selectedList = players.filter((p) => selectedPlayers.has(p.id));
        const options = '<option value="">Select</option>' + selectedList.map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
        captainSelect.innerHTML = options;
        viceCaptainSelect.innerHTML = options;
      });
    });
  };

  try {
    const [series, playerData] = await Promise.all([
      fetchCricApi('series', { offset: 0 }),
      fetchCricApi('players', { offset: 0 }),
    ]);

    players = mergePlayersWithRealLife(playerData, kagglePlayers);
    tournaments = enrichSeriesWithGender(series);
    renderTournamentOptions(tournamentGenderSelect?.value || 'all');
    renderPlayerPool();
    renderTeams();
  } catch (error) {
    playerPool.innerHTML = `<article class="card"><p class="muted">Failed to load player pool: ${escapeHtml(error.message)}</p></article>`;
    renderTeams();
  }

  searchInput?.addEventListener('input', (e) => renderPlayerPool(e.target.value));
  genderFilter?.addEventListener('change', () => renderPlayerPool(searchInput?.value || ''));
  tournamentGenderSelect?.addEventListener('change', () => renderTournamentOptions(tournamentGenderSelect.value || 'all'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = teamNameInput.value.trim();
    const selectedList = players.filter((p) => selectedPlayers.has(p.id));
    if (!name || selectedList.length < 2) return;

    const team = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      tournament: tournamentSelect.value,
      tournamentName: tournamentSelect.selectedOptions?.[0]?.textContent || 'All Tournaments',
      players: selectedList.map((p) => p.name),
      captain: captainSelect.value || '',
      viceCaptain: viceCaptainSelect.value || '',
      user: 'You',
      createdAt: new Date().toISOString(),
    };

    const teams = getStoredFantasyTeams();
    teams.push(team);
    saveFantasyTeams(teams);

    form.reset();
    selectedPlayers = new Set();
    renderPlayerPool();
    renderTeams();
  });
}

async function initSeriesPage() {
  const seriesGrid = document.querySelector('#seriesGrid');
  if (!seriesGrid) return;

  const genderFilter = document.querySelector('#seriesGenderFilter');
  const info = document.querySelector('#tournamentGenderInfo');

  let series = [];

  const render = (gender = 'all') => {
    const filtered = series.filter((item) => gender === 'all' || item.gender === gender);

    if (!filtered.length) {
      seriesGrid.innerHTML = '<article class="card"><p class="muted">No tournaments found for selected category.</p></article>';
      if (info) info.textContent = 'No tournament data available for this category.';
      return;
    }

    seriesGrid.innerHTML = filtered.slice(0, 30).map((item) => `
      <article class="card" data-search="${escapeHtml(item.name || '')}">
        <div class="card-top"><span class="badge">SERIES</span><span class="badge">${escapeHtml(tournamentGenderLabel(item.gender))}</span></div>
        <h3>${escapeHtml(item.name || 'Unknown Tournament')}</h3>
        <p class="muted">Start: ${escapeHtml(item.startDate || 'N/A')} · End: ${escapeHtml(item.endDate || 'N/A')}</p>
      </article>
    `).join('');

    if (info) {
      const maleCount = series.filter((s) => s.gender === 'men').length;
      const femaleCount = series.filter((s) => s.gender === 'women').length;
      info.textContent = `Male Tournaments: ${maleCount} · Female Tournaments: ${femaleCount}`;
    }
  };

  try {
    const rawSeries = await fetchCricApi('series', { offset: 0 });
    series = enrichSeriesWithGender(rawSeries);
    render(genderFilter?.value || 'all');
  } catch (error) {
    seriesGrid.innerHTML = `<article class="card"><p class="muted">Failed to load tournaments: ${escapeHtml(error.message)}</p></article>`;
    if (info) info.textContent = 'Tournament load failed';
  }

  genderFilter?.addEventListener('change', () => render(genderFilter.value || 'all'));
}

function initLeaderboard() {
  const body = document.querySelector('#leaderboardBody');
  if (!body) return;

  const teams = getStoredFantasyTeams();
  if (!teams.length) {
    body.innerHTML = '<tr><td colspan="6" class="muted">No teams found. Create teams in Team Management.</td></tr>';
    return;
  }

  const ranked = teams
    .map((team) => ({
      ...team,
      score: computeTeamScore(team),
      user: team.user || 'User',
    }))
    .sort((a, b) => b.score - a.score);

  body.innerHTML = ranked
    .map((team, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(team.user)}</td>
        <td>${escapeHtml(team.name)}</td>
        <td>${escapeHtml(team.tournamentName || 'All Tournaments')}</td>
        <td>${escapeHtml(team.captain || 'N/A')}</td>
        <td>${team.score}</td>
      </tr>
    `)
    .join('');
}

function buildMatchCard(match, tagLabel) {
  const team1 = match.t1 || 'Team 1';
  const team2 = match.t2 || 'Team 2';
  const format = (match.matchType || 'N/A').toUpperCase();
  const status = match.status || 'Status unavailable';
  const series = match.series || 'Unknown series';
  const searchText = `${team1} ${team2} ${series} ${status}`;
  const id = match.id || '';

  return `
    <article class="card" data-search="${escapeHtml(searchText)}" data-format="${escapeHtml(format)}">
      <div class="card-top"><span class="badge">${escapeHtml(tagLabel)}</span><span class="badge">${escapeHtml(format)}</span></div>
      <div class="team-row"><span>${escapeHtml(team1)}</span><button class="icon-btn bookmark">☆</button></div>
      <div class="team-row"><span>${escapeHtml(team2)}</span><span class="muted">${escapeHtml(status)}</span></div>
      <div class="muted">${escapeHtml(series)}</div>
      <div class="quick-actions"><a class="btn" href="pages/match.html?id=${encodeURIComponent(id)}">Quick View</a><button class="btn">Follow</button></div>
    </article>
  `;
}

function filterMatchBuckets(matches) {
  const live = [];
  const recent = [];
  const upcoming = [];

  matches.forEach((match) => {
    const statusText = (match.status || '').toLowerCase();
    const state = (match.ms || '').toLowerCase();

    if (state === 'result' || statusText.includes('won') || statusText.includes('completed')) {
      recent.push(match);
    } else if (state === 'fixture' || statusText.includes('starts') || statusText.includes('toss')) {
      upcoming.push(match);
    } else {
      live.push(match);
    }
  });

  return { live, recent, upcoming };
}

function renderMatchSection(containerId, matches, tagLabel) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;

  if (!matches.length) {
    container.innerHTML = '<article class="card"><p class="muted">No matches available right now.</p></article>';
    return;
  }

  container.innerHTML = matches.slice(0, 6).map((m) => buildMatchCard(m, tagLabel)).join('');
}

async function initRealtimeHomeData() {
  const liveGrid = document.querySelector('#liveGrid');
  if (!liveGrid) return;

  const updateLabel = document.querySelector('#liveLastUpdated');

  const load = async () => {
    try {
      const all = await fetchCricApi('cricScore', { offset: 0 });
      const buckets = filterMatchBuckets(all);
      renderMatchSection('liveGrid', buckets.live, 'LIVE');
      renderMatchSection('recentGrid', buckets.recent, 'RECENT');
      renderMatchSection('upcomingGrid', buckets.upcoming, 'UPCOMING');
      initBookmarks();
      if (updateLabel) updateLabel.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      ['liveGrid', 'recentGrid', 'upcomingGrid'].forEach((id) => {
        const el = document.querySelector(`#${id}`);
        if (el) el.innerHTML = `<article class="card"><p class="muted">${escapeHtml(error.message)}</p></article>`;
      });
      if (updateLabel) updateLabel.textContent = 'Update failed';
    }
  };

  await load();
  setInterval(load, 60000);
}

async function initRealtimeMatchDetail() {
  const teamsEl = document.querySelector('#matchTeams');
  if (!teamsEl) return;

  try {
    const all = await fetchCricApi('cricScore', { offset: 0 });
    const queryParams = new URLSearchParams(window.location.search);
    const matchId = queryParams.get('id');
    const selected = all.find((m) => m.id === matchId) || all[0];

    if (!selected) {
      document.querySelector('#livePanelText').textContent = 'No match data available.';
      return;
    }

    document.querySelector('#matchTeams').textContent = `${selected.t1 || 'Team 1'} · ${selected.t2 || 'Team 2'}`;
    document.querySelector('#matchStatus').textContent = `Match Status: ${selected.status || 'N/A'}`;
    document.querySelector('#matchVenue').textContent = `Venue: ${selected.venue || 'N/A'}`;
    document.querySelector('#matchDate').textContent = `Date: ${selected.dateTimeGMT || 'N/A'}`;
    document.querySelector('#matchFormat').textContent = `Format: ${(selected.matchType || 'N/A').toUpperCase()}`;
    document.querySelector('#livePanelText').textContent = `${selected.series || 'Series unavailable'} · ${selected.status || ''}`;
  } catch (error) {
    document.querySelector('#livePanelText').textContent = `Failed to load real-time data: ${error.message}`;
  }
}

async function initRealtimeNews() {
  const newsGrid = document.querySelector('#newsGrid');
  if (!newsGrid) return;

  const updatedEl = document.querySelector('#newsLastUpdated');
  const sources = [
    { name: 'ESPN Cricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' },
    { name: 'BBC Cricket', url: 'http://feeds.bbci.co.uk/sport/cricket/rss.xml' },
  ];

  const loadNews = async () => {
    try {
      const results = await Promise.all(sources.map(async (source) => {
        const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
        const response = await fetch(rssToJsonUrl);
        const payload = await response.json();
        if (payload.status !== 'ok' || !Array.isArray(payload.items)) return [];
        return payload.items.map((item) => ({ ...item, sourceName: source.name }));
      }));

      const items = results.flat().sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0)).slice(0, 8);
      if (!items.length) throw new Error('News feed not available');

      newsGrid.innerHTML = items.map((item) => {
        const title = item.title || 'Untitled news';
        const summary = stripHtml(item.description || '').slice(0, 140) || 'No summary available';
        const dateText = item.pubDate ? new Date(item.pubDate).toLocaleString() : 'Unknown date';
        const source = item.sourceName || 'Cricket News';
        const link = item.link || '#';
        const searchText = `${title} ${summary} ${source}`;

        return `
          <article class="card" data-search="${escapeHtml(searchText)}">
            <h3>${escapeHtml(title)}</h3>
            <p class="muted">${escapeHtml(summary)}</p>
            <p class="muted">${escapeHtml(source)} · ${escapeHtml(dateText)}</p>
            <a class="btn" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Read Article</a>
          </article>
        `;
      }).join('');

      if (updatedEl) updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      newsGrid.innerHTML = `<article class="card"><p class="muted">Failed to load real-time news: ${escapeHtml(error.message)}</p></article>`;
      if (updatedEl) updatedEl.textContent = 'Update failed';
    }
  };

  await loadNews();
  setInterval(loadNews, 120000);
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenuToggle();
  initSearchFilter();
  initFormatFilter();
  initBookmarks();
  initTabs();
  initPredictionModule();
  initPredictionDataSources();
  initRealtimeHomeData();
  initRealtimeMatchDetail();
  initRealtimeNews();
  initPlayerStatisticsPage();
  initTeamManagement();
  initLeaderboard();
  initSeriesPage();

  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
});
