const $ = selector => document.querySelector(selector);
const state = { events: [], todayEvents: [], standings: [], loadedAt: null };

const API = {
  base: `${APP_CONFIG.baseUrl}/${APP_CONFIG.apiKey}`,
  season: `${APP_CONFIG.baseUrl}/${APP_CONFIG.apiKey}/eventsseason.php?id=${APP_CONFIG.leagueId}&s=${encodeURIComponent(APP_CONFIG.season)}`,
  next: `${APP_CONFIG.baseUrl}/${APP_CONFIG.apiKey}/eventsnextleague.php?id=${APP_CONFIG.leagueId}`,
  previous: `${APP_CONFIG.baseUrl}/${APP_CONFIG.apiKey}/eventspastleague.php?id=${APP_CONFIG.leagueId}`,
  table: `${APP_CONFIG.baseUrl}/${APP_CONFIG.apiKey}/lookuptable.php?l=${APP_CONFIG.leagueId}&s=${encodeURIComponent(APP_CONFIG.season)}`
};

function init() {
  $('#themeToggle').addEventListener('click', () => document.body.classList.toggle('dark'));
  $('#refreshData').addEventListener('click', () => loadTournamentData({ force: true }));
  ['searchInput', 'roundFilter', 'statusFilter'].forEach(id => $('#' + id).addEventListener('input', renderFixtures));
  $('#todayDate').textContent = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(new Date());
  loadTournamentData();
}

async function loadTournamentData({ force = false } = {}) {
  setDataStatus('Updating tournament centre', 'Loading fixtures, results, tables, venues and kick-off times from TheSportsDB…');
  try {
    const cached = readCache();
    if (!force && cached) {
      applyData(cached);
      setDataStatus('Tournament centre ready', `Using cached ${APP_CONFIG.providerName} data from ${formatDateTime(cached.loadedAt)}.`);
      return;
    }

    const today = todayIso();
    const urls = [
      API.season,
      API.next,
      API.previous,
      `${API.base}/eventsday.php?d=${today}&l=${APP_CONFIG.leagueId}`,
      API.table
    ];
    const [seasonData, nextData, previousData, todayData, tableData] = await Promise.all(urls.map(fetchJson));
    const payload = {
      loadedAt: new Date().toISOString(),
      events: uniqueEvents([
        ...extractEvents(seasonData),
        ...extractEvents(nextData),
        ...extractEvents(previousData)
      ]),
      todayEvents: extractEvents(todayData).filter(isWorldCupEvent),
      standings: extractTable(tableData)
    };

    writeCache(payload);
    applyData(payload);
    setDataStatus('Tournament centre ready', `Updated from ${APP_CONFIG.providerName} at ${formatDateTime(payload.loadedAt)}.`);
  } catch (error) {
    const cached = readCache({ allowExpired: true });
    if (cached) {
      applyData(cached);
      setDataStatus('Using saved data', `Could not reach ${APP_CONFIG.providerName}. Showing saved data from ${formatDateTime(cached.loadedAt)}.`);
    } else {
      setDataStatus('Data unavailable', `Could not load tournament data from ${APP_CONFIG.providerName}. Please try again later.`);
      renderEmptyState();
    }
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), APP_CONFIG.requestTimeoutMs);
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function applyData(payload) {
  state.events = payload.events.map(normaliseEvent).filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date));
  state.todayEvents = payload.todayEvents.map(normaliseEvent).filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date));
  state.standings = payload.standings || [];
  state.loadedAt = payload.loadedAt;
  renderAll();
}

function renderAll() {
  renderStats();
  renderFilters();
  renderToday();
  renderScotland();
  renderFixtures();
  renderGroups();
  renderBracket();
  renderVenues();
}

function renderStats() {
  const scotland = scotlandEvents();
  const completed = state.events.filter(isCompleted).length;
  const venues = new Set(state.events.map(e => e.venue).filter(Boolean)).size;
  const teams = new Set(state.events.flatMap(e => [e.home, e.away]).filter(Boolean)).size;
  $('#stats').innerHTML = [
    [state.events.length, 'Fixtures and results'],
    [teams, 'Teams tracked'],
    [venues, 'Venues'],
    [completed, 'Completed matches']
  ].map(([value, label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');

  const next = scotland.find(e => !isCompleted(e) && new Date(e.date) >= startOfToday());
  $('#scotlandSummaryTitle').textContent = next ? 'Next Scotland fixture' : 'Scotland overview';
  $('#nextScotlandMatch').innerHTML = next
    ? `<b>${matchLine(next)}</b><br><span>${formatDateTime(next.date)} • ${safe(next.venue, 'Venue TBC')}</span>`
    : scotland.length ? 'Scotland fixtures are shown below.' : 'Scotland fixtures will appear when available from the tournament feed.';
}

function renderFilters() {
  const roundSelect = $('#roundFilter');
  const selected = roundSelect.value || 'all';
  roundSelect.innerHTML = '<option value="all">All rounds</option>';
  [...new Set(state.events.map(e => e.round).filter(Boolean))].sort(roundSort).forEach(round => {
    roundSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(round)}">${escapeHtml(round)}</option>`);
  });
  roundSelect.value = [...roundSelect.options].some(o => o.value === selected) ? selected : 'all';
}

function renderToday() {
  const todayEvents = state.todayEvents.length ? state.todayEvents : state.events.filter(e => sameDay(e.date, new Date()));
  $('#todayFixtures').innerHTML = todayEvents.length
    ? todayEvents.map(matchCard).join('')
    : '<p class="note full-width">No World Cup fixtures are listed for today.</p>';
}

function renderScotland() {
  const list = scotlandEvents();
  $('#scotlandFixtures').innerHTML = list.length
    ? list.map(e => matchCard(e, true)).join('')
    : '<p class="note full-width">Scotland fixtures are not yet available from the current tournament feed.</p>';
}

function renderFixtures() {
  const rows = filteredEvents();
  $('#fixtureRows').innerHTML = rows.length
    ? rows.map(e => `<tr class="${isScotland(e) ? 'row-scotland' : ''}"><td>${formatDateTime(e.date)}</td><td><span class="badge">${escapeHtml(e.round)}</span></td><td><b>${matchLine(e)}</b></td><td>${escapeHtml(safe(e.venue, 'Venue TBC'))}</td><td>${statusBadge(e)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="note">No matches found for the selected filters.</td></tr>';
}

function renderGroups() {
  const apiTables = groupApiTables();
  if (apiTables.length) {
    $('#groupTables').innerHTML = apiTables.map(renderTable).join('');
    return;
  }
  const calculated = calculateTables();
  $('#groupTables').innerHTML = calculated.length
    ? calculated.map(renderTable).join('')
    : '<p class="note full-width">Group tables will appear after standings or completed group results are available from the API.</p>';
}

function renderBracket() {
  const knockout = state.events.filter(e => isKnockout(e));
  const rounds = [...new Set(knockout.map(e => e.round))].sort(roundSort);
  $('#bracket').innerHTML = rounds.length
    ? rounds.map(round => `<div class="round"><h3>${escapeHtml(round)}</h3>${knockout.filter(e => e.round === round).map(e => `<div class="tie ${isScotland(e) ? 'scotland-tie' : ''}"><b>${matchLine(e)}</b><p class="meta">${formatDateTime(e.date)}<br>${escapeHtml(safe(e.venue, 'Venue TBC'))}<br>${plainStatus(e)}</p></div>`).join('')}</div>`).join('')
    : '<p class="note full-width">Knockout fixtures will appear when they are published in the API feed.</p>';
}

function renderVenues() {
  const venues = [...state.events.reduce((map, e) => {
    if (!e.venue) return map;
    const item = map.get(e.venue) || { venue: e.venue, matches: 0, next: null };
    item.matches += 1;
    if (!item.next || new Date(e.date) < new Date(item.next.date)) item.next = e;
    map.set(e.venue, item);
    return map;
  }, new Map()).values()].sort((a, b) => a.venue.localeCompare(b.venue));

  $('#venuesGrid').innerHTML = venues.length
    ? venues.map(v => `<article class="venue-card"><h3>${escapeHtml(v.venue)}</h3><p>${v.matches} match${v.matches === 1 ? '' : 'es'}</p><span class="meta">Next: ${v.next ? matchLine(v.next) : 'TBC'}</span></article>`).join('')
    : '<p class="note full-width">Venue information will appear when available from the API feed.</p>';
}

function renderEmptyState() {
  $('#stats').innerHTML = '';
  ['todayFixtures', 'scotlandFixtures', 'groupTables', 'bracket', 'venuesGrid'].forEach(id => $('#' + id).innerHTML = '<p class="note full-width">Data unavailable.</p>');
  $('#fixtureRows').innerHTML = '<tr><td colspan="5" class="note">Data unavailable.</td></tr>';
  $('#nextScotlandMatch').textContent = 'Data unavailable.';
}

function filteredEvents() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const round = $('#roundFilter').value;
  const status = $('#statusFilter').value;
  return state.events.filter(e => {
    const matchesQuery = !query || JSON.stringify(e).toLowerCase().includes(query);
    const matchesRound = round === 'all' || e.round === round;
    const matchesStatus = status === 'all' || (status === 'completed' ? isCompleted(e) : !isCompleted(e));
    return matchesQuery && matchesRound && matchesStatus;
  });
}

function matchCard(event, scotland = false) {
  return `<article class="match-card ${scotland || isScotland(event) ? 'scotland' : ''}"><span class="badge">${escapeHtml(event.round)}</span><div class="teams">${matchLine(event)}</div><p class="meta">${formatDateTime(event.date)}<br>${escapeHtml(safe(event.venue, 'Venue TBC'))}<br>${plainStatus(event)}</p></article>`;
}

function renderTable(group) {
  return `<div class="group-table"><h3>${escapeHtml(group.name)}</h3><table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${group.rows.map(r => `<tr class="${teamName(r.team) === APP_CONFIG.scotlandName ? 'row-scotland' : ''}"><td>${teamName(r.team) === APP_CONFIG.scotlandName ? '🏴 ' : ''}${escapeHtml(teamName(r.team))}</td><td>${number(r.played)}</td><td>${number(r.wins)}</td><td>${number(r.draws)}</td><td>${number(r.losses)}</td><td>${number(r.goalDifference)}</td><td><b>${number(r.points)}</b></td></tr>`).join('')}</tbody></table></div>`;
}

function normaliseEvent(event) {
  const home = event.strHomeTeam;
  const away = event.strAwayTeam;
  if (!home || !away) return null;
  return {
    id: event.idEvent,
    home,
    away,
    homeScore: toNumber(event.intHomeScore),
    awayScore: toNumber(event.intAwayScore),
    date: event.strTimestamp || combineDateTime(event.dateEvent, event.strTime),
    venue: event.strVenue || event.strStadium || '',
    round: cleanRound(event.intRound || event.strRound || event.strEventAlternate || event.strStage || 'Fixture'),
    group: event.strGroup || event.strStage || '',
    status: event.strStatus || event.strProgress || '',
    league: event.idLeague || event.strLeague || ''
  };
}

function extractEvents(payload) {
  if (!payload) return [];
  return payload.events || payload.event || payload.results || payload.schedule || [];
}

function extractTable(payload) {
  const rows = payload?.table || payload?.tables || payload?.standing || [];
  return Array.isArray(rows) ? rows : [];
}

function isWorldCupEvent(event) {
  return String(event.idLeague || event.strLeague || '').includes(APP_CONFIG.leagueId) || /world cup/i.test(String(event.strLeague || ''));
}

function uniqueEvents(events) {
  const map = new Map();
  events.filter(Boolean).forEach(event => {
    const key = event.idEvent || `${event.dateEvent}-${event.strHomeTeam}-${event.strAwayTeam}`;
    map.set(key, event);
  });
  return [...map.values()];
}

function groupApiTables() {
  if (!state.standings.length) return [];
  const groups = new Map();
  state.standings.forEach(row => {
    const name = row.strGroup || row.strDescription || row.intRankGroup || 'Standings';
    const item = groups.get(name) || { name, rows: [] };
    item.rows.push({
      team: row.strTeam || row.strTeamBadge || row.idTeam,
      played: row.intPlayed,
      wins: row.intWin,
      draws: row.intDraw,
      losses: row.intLoss,
      goalDifference: row.intGoalDifference || (toNumber(row.intGoalsFor) - toNumber(row.intGoalsAgainst)),
      points: row.intPoints
    });
    groups.set(name, item);
  });
  return [...groups.values()].map(group => ({ ...group, rows: sortRows(group.rows) }));
}

function calculateTables() {
  const groupEvents = state.events.filter(e => !isKnockout(e) && isCompleted(e) && e.group);
  const groups = new Map();
  groupEvents.forEach(e => {
    const groupName = e.group;
    const group = groups.get(groupName) || { name: groupName, rows: new Map() };
    [e.home, e.away].forEach(team => {
      if (!group.rows.has(team)) group.rows.set(team, { team, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, goalsFor: 0 });
    });
    const home = group.rows.get(e.home);
    const away = group.rows.get(e.away);
    home.played += 1; away.played += 1;
    home.goalsFor += e.homeScore; away.goalsFor += e.awayScore;
    home.goalDifference += e.homeScore - e.awayScore;
    away.goalDifference += e.awayScore - e.homeScore;
    if (e.homeScore > e.awayScore) { home.wins += 1; away.losses += 1; home.points += 3; }
    else if (e.homeScore < e.awayScore) { away.wins += 1; home.losses += 1; away.points += 3; }
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
    groups.set(groupName, group);
  });
  return [...groups.values()].map(group => ({ name: group.name, rows: sortRows([...group.rows.values()]) }));
}

function sortRows(rows) {
  return rows.sort((a, b) => number(b.points) - number(a.points) || number(b.goalDifference) - number(a.goalDifference) || number(b.goalsFor) - number(a.goalsFor) || teamName(a.team).localeCompare(teamName(b.team)));
}

function isCompleted(e) {
  return Number.isFinite(e.homeScore) && Number.isFinite(e.awayScore);
}

function isKnockout(e) {
  return /round of|quarter|semi|final|third/i.test(e.round) && !/group/i.test(e.round);
}

function isScotland(e) {
  return teamName(e.home) === APP_CONFIG.scotlandName || teamName(e.away) === APP_CONFIG.scotlandName;
}

function scotlandEvents() {
  return state.events.filter(isScotland);
}

function matchLine(e) {
  const home = escapeHtml(e.home);
  const away = escapeHtml(e.away);
  return isCompleted(e) ? `${home} ${e.homeScore}–${e.awayScore} ${away}` : `${home} vs ${away}`;
}

function plainStatus(e) {
  return isCompleted(e) ? 'Result confirmed' : 'Scheduled';
}

function statusBadge(e) {
  return `<span class="badge ${isCompleted(e) ? 'result-badge' : ''}">${plainStatus(e)}</span>`;
}

function cleanRound(value) {
  const text = String(value || '').trim();
  if (!text) return 'Fixture';
  if (/^\d+$/.test(text)) return `Round ${text}`;
  return text.replace(/_/g, ' ');
}

function roundSort(a, b) {
  const order = ['Group', 'Round 1', 'Round 2', 'Round 3', 'Round of 32', 'Round of 16', 'Quarter-final', 'Quarter Final', 'Semi-final', 'Semi Final', 'Third-place', 'Final'];
  const ai = order.findIndex(x => a.toLowerCase().includes(x.toLowerCase()));
  const bi = order.findIndex(x => b.toLowerCase().includes(x.toLowerCase()));
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
}

function readCache({ allowExpired = false } = {}) {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ageMs = Date.now() - new Date(parsed.loadedAt).getTime();
    if (!allowExpired && ageMs > APP_CONFIG.cacheHours * 60 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(payload) {
  localStorage.setItem(cacheKey(), JSON.stringify(payload));
}

function cacheKey() {
  return `wc-centre-${APP_CONFIG.leagueId}-${APP_CONFIG.season}`;
}

function setDataStatus(title, text) {
  $('#dataStatusTitle').textContent = title;
  $('#dataStatus').textContent = text;
}

function formatDateTime(value) {
  if (!value) return 'Date TBC';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBC';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function combineDateTime(date, time) {
  if (!date) return '';
  const cleanTime = time && time !== '00:00:00+00:00' ? time.replace(/\+.*$/, '') : '00:00:00';
  return `${date}T${cleanTime}Z`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(value, date) {
  const d = new Date(value);
  return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function teamName(value) {
  return String(value || '').replace('Czech Republic', 'Czechia').replace('Turkiye', 'Turkey').replace('Türkiye', 'Turkey').trim();
}

function safe(value, fallback) {
  return value ? value : fallback;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

init();
