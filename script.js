/**
 * Scotland 2026 Fan Hub
 * Plain JavaScript, GitHub Pages-friendly.
 *
 * TheSportsDB docs:
 * v1 base: https://www.thesportsdb.com/api/v1/json
 * Free demo key: 123
 * Premium users can replace API_KEY below.
 */

const CONFIG = {
  API_BASE_URL: "https://www.thesportsdb.com/api/v1/json",
  API_KEY: "123",

  /**
   * Optional tuning:
   * - SCOTLAND_TEAM_ID can be left blank. The app will try searchteams.php?t=Scotland.
   * - WORLD_CUP_LEAGUE_ID is commonly listed as 4429 for FIFA World Cup data.
   *   Change this if TheSportsDB uses a different 2026 tournament record.
   */
  SCOTLAND_TEAM_ID: "",
  WORLD_CUP_LEAGUE_ID: "4429",
  WORLD_CUP_SEASON: "2026",

  REQUEST_TIMEOUT_MS: 9000,
  ENABLE_LIVE_API: true
};

const FALLBACK = {
  fixtures: [
    {
      opponent: "Haiti",
      homeTeam: "Haiti",
      awayTeam: "Scotland",
      date: "2026-06-14T02:00:00+01:00",
      venue: "Boston Stadium",
      stage: "Group C",
      status: "Scheduled",
      homeScore: null,
      awayScore: null
    },
    {
      opponent: "Morocco",
      homeTeam: "Scotland",
      awayTeam: "Morocco",
      date: "2026-06-19T23:00:00+01:00",
      venue: "Boston Stadium",
      stage: "Group C",
      status: "Scheduled",
      homeScore: null,
      awayScore: null
    },
    {
      opponent: "Brazil",
      homeTeam: "Scotland",
      awayTeam: "Brazil",
      date: "2026-06-24T23:00:00+01:00",
      venue: "Miami Stadium",
      stage: "Group C",
      status: "Scheduled",
      homeScore: null,
      awayScore: null
    }
  ],

  squad: [
    { name: "Craig Gordon", position: "Goalkeeper", club: "Hearts" },
    { name: "Angus Gunn", position: "Goalkeeper", club: "Nottingham Forest" },
    { name: "Liam Kelly", position: "Goalkeeper", club: "Rangers" },
    { name: "Grant Hanley", position: "Defender", club: "Hibernian" },
    { name: "Jack Hendry", position: "Defender", club: "Al-Ettifaq" },
    { name: "Aaron Hickey", position: "Defender", club: "Brentford" },
    { name: "Dom Hyam", position: "Defender", club: "Wrexham" },
    { name: "Scott McKenna", position: "Defender", club: "Dinamo Zagreb" },
    { name: "Nathan Patterson", position: "Defender", club: "Everton" },
    { name: "Anthony Ralston", position: "Defender", club: "Celtic" },
    { name: "Andy Robertson", position: "Defender", club: "Liverpool" },
    { name: "John Souttar", position: "Defender", club: "Rangers" },
    { name: "Kieran Tierney", position: "Defender", club: "Celtic" },
    { name: "Ryan Christie", position: "Midfielder", club: "AFC Bournemouth" },
    { name: "Findlay Curtis", position: "Midfielder", club: "Kilmarnock" },
    { name: "Lewis Ferguson", position: "Midfielder", club: "Bologna" },
    { name: "Ben Gannon-Doak", position: "Midfielder", club: "Liverpool" },
    { name: "Tyler Fletcher", position: "Midfielder", club: "Manchester United" },
    { name: "John McGinn", position: "Midfielder", club: "Aston Villa" },
    { name: "Kenny McLean", position: "Midfielder", club: "Norwich City" },
    { name: "Scott McTominay", position: "Midfielder", club: "Napoli" },
    { name: "Ché Adams", position: "Forward", club: "Torino" },
    { name: "Lyndon Dykes", position: "Forward", club: "Charlton Athletic" },
    { name: "George Hirst", position: "Forward", club: "Ipswich Town" },
    { name: "Lawrence Shankland", position: "Forward", club: "Hearts" },
    { name: "Ross Stewart", position: "Forward", club: "Southampton" }
  ],

  standings: [
    { team: "Brazil", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { team: "Morocco", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { team: "Haiti", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { team: "Scotland", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
  ]
};

const els = {
  navToggle: document.querySelector(".nav-toggle"),
  navMenu: document.querySelector("#nav-menu"),
  apiBanner: document.querySelector("#api-banner"),
  fixturesStatus: document.querySelector("#fixtures-status"),
  fixturesGrid: document.querySelector("#fixtures-grid"),
  squadStatus: document.querySelector("#squad-status"),
  squadGrid: document.querySelector("#squad-grid"),
  standingsStatus: document.querySelector("#standings-status"),
  standingsTable: document.querySelector("#standings-table"),
  lastUpdated: document.querySelector("#last-updated"),
  year: document.querySelector("#year")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  setupNavigation();

  els.year.textContent = String(new Date().getFullYear());

  renderFixturesLoading();
  renderSquadLoading();
  renderStandingsLoading();

  loadAllData();
}

function setupNavigation() {
  if (!els.navToggle || !els.navMenu) return;

  els.navToggle.addEventListener("click", () => {
    const isOpen = els.navMenu.classList.toggle("is-open");
    els.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  els.navMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      els.navMenu.classList.remove("is-open");
      els.navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

async function loadAllData() {
  if (!CONFIG.ENABLE_LIVE_API) {
    renderFallbackData("Live API disabled in CONFIG.");
    return;
  }

  const results = await Promise.allSettled([
    loadFixtures(),
    loadSquad(),
    loadStandings()
  ]);

  const liveCount = results.filter(
    (result) => result.status === "fulfilled" && result.value === "live"
  ).length;

  const now = new Date();
  els.lastUpdated.textContent = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(now);
  els.lastUpdated.dateTime = now.toISOString();

  if (liveCount > 0) {
    setApiBanner(`Live data loaded for ${liveCount} section${liveCount === 1 ? "" : "s"}; fallbacks cover the rest.`);
  } else {
    setApiBanner("Using fallback data. Add or update TheSportsDB settings in script.js for live coverage.");
  }
}

function renderFallbackData(reason) {
  renderFixtures(FALLBACK.fixtures, {
    source: "fallback",
    message: `Fallback fixtures shown. ${reason}`
  });
  renderSquad(FALLBACK.squad, {
    source: "fallback",
    message: `Fallback squad shown. ${reason}`
  });
  renderStandings(FALLBACK.standings, {
    source: "fallback",
    message: `Fallback group table shown. ${reason}`
  });
  setApiBanner(`Fallback mode: ${reason}`);
}

/* ----------------------------- API client ----------------------------- */

async function apiRequest(endpoint, params = {}) {
  const url = buildApiUrl(endpoint, params);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`TheSportsDB request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      throw new Error("TheSportsDB returned an unexpected response.");
    }

    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildApiUrl(endpoint, params) {
  const url = new URL(`${CONFIG.API_BASE_URL}/${CONFIG.API_KEY}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function getScotlandTeam() {
  if (CONFIG.SCOTLAND_TEAM_ID) {
    const lookup = await apiRequest("lookupteam.php", { id: CONFIG.SCOTLAND_TEAM_ID });
    const team = firstArrayItem(lookup.teams);
    if (team) return team;
  }

  const search = await apiRequest("searchteams.php", { t: "Scotland" });
  const teams = Array.isArray(search.teams) ? search.teams : [];

  return teams.find((team) => {
    const name = normalise(team.strTeam);
    const sport = normalise(team.strSport);
    return name.includes("scotland") && sport.includes("soccer");
  }) || teams.find((team) => normalise(team.strTeam).includes("scotland"));
}

async function getScotlandEvents(teamId) {
  const [nextResult, lastResult, searchResults] = await Promise.allSettled([
    apiRequest("eventsnext.php", { id: teamId }),
    apiRequest("eventslast.php", { id: teamId }),
    searchFallbackFixtureEvents()
  ]);

  const events = [];

  if (nextResult.status === "fulfilled") {
    events.push(...toArray(nextResult.value.events));
  }

  if (lastResult.status === "fulfilled") {
    events.push(...toArray(lastResult.value.results));
  }

  if (searchResults.status === "fulfilled") {
    events.push(...searchResults.value);
  }

  return uniqueBy(events, "idEvent")
    .filter(isScotlandEvent)
    .sort(sortEventsByDate);
}

async function searchFallbackFixtureEvents() {
  const searches = FALLBACK.fixtures.map((fixture) => {
    const eventName = `${fixture.homeTeam}_vs_${fixture.awayTeam}`.replaceAll(" ", "_");
    return apiRequest("searchevents.php", {
      e: eventName,
      s: CONFIG.WORLD_CUP_SEASON
    });
  });

  const results = await Promise.allSettled(searches);
  return results.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return toArray(result.value.event || result.value.events);
  });
}

/* ----------------------------- Loaders ----------------------------- */

async function loadFixtures() {
  try {
    const team = await getScotlandTeam();

    if (!team?.idTeam) {
      throw new Error("Scotland team record was not found.");
    }

    const events = await getScotlandEvents(team.idTeam);
    const mapped = events.map(mapApiEvent).filter(Boolean);

    if (!mapped.length) {
      throw new Error("No Scotland event records were returned.");
    }

    renderFixtures(mapped.slice(0, 8), {
      source: "live",
      message: "Live fixtures/results loaded from TheSportsDB."
    });

    return "live";
  } catch (error) {
    console.warn(error);
    renderFixtures(FALLBACK.fixtures, {
      source: "fallback",
      message: "Fallback fixtures shown because live fixture data is unavailable."
    });
    return "fallback";
  }
}

async function loadSquad() {
  try {
    const team = await getScotlandTeam();

    if (!team?.idTeam) {
      throw new Error("Scotland team record was not found.");
    }

    const data = await apiRequest("lookup_all_players.php", { id: team.idTeam });
    const players = toArray(data.player || data.players)
      .map(mapApiPlayer)
      .filter(Boolean)
      .slice(0, 26);

    if (!players.length) {
      throw new Error("No Scotland player records were returned.");
    }

    renderSquad(players, {
      source: "live",
      message: "Live squad/player data loaded from TheSportsDB."
    });

    return "live";
  } catch (error) {
    console.warn(error);
    renderSquad(FALLBACK.squad, {
      source: "fallback",
      message: "Fallback squad shown because live player data is unavailable."
    });
    return "fallback";
  }
}

async function loadStandings() {
  try {
    if (!CONFIG.WORLD_CUP_LEAGUE_ID) {
      throw new Error("WORLD_CUP_LEAGUE_ID is not configured.");
    }

    const data = await apiRequest("lookuptable.php", {
      l: CONFIG.WORLD_CUP_LEAGUE_ID,
      s: CONFIG.WORLD_CUP_SEASON
    });

    const rows = toArray(data.table)
      .map(mapApiTableRow)
      .filter(Boolean);

    const groupRows = extractScotlandGroup(rows);

    if (!groupRows.length) {
      throw new Error("No Scotland group rows were returned.");
    }

    renderStandings(groupRows, {
      source: "live",
      message: "Live table data loaded from TheSportsDB."
    });

    return "live";
  } catch (error) {
    console.warn(error);
    renderStandings(FALLBACK.standings, {
      source: "fallback",
      message: "Fallback Group C table shown because live standings are unavailable."
    });
    return "fallback";
  }
}

/* ----------------------------- Renderers ----------------------------- */

function renderFixturesLoading() {
  els.fixturesStatus.textContent = "Loading fixtures…";
  els.fixturesGrid.innerHTML = skeletonCards(3, "fixture-card");
}

function renderSquadLoading() {
  els.squadStatus.textContent = "Loading squad…";
  els.squadGrid.innerHTML = skeletonCards(8, "player-card");
}

function renderStandingsLoading() {
  els.standingsStatus.textContent = "Loading standings…";
  els.standingsTable.innerHTML = "";
}

function renderFixtures(fixtures, { source, message }) {
  els.fixturesStatus.textContent = message;
  els.fixturesGrid.innerHTML = fixtures.map((fixture) => {
    const date = formatDate(fixture.date);
    const time = formatTime(fixture.date);
    const homeScore = scoreText(fixture.homeScore);
    const awayScore = scoreText(fixture.awayScore);

    return `
      <article class="fixture-card">
        <div class="fixture-card-inner">
          <div class="fixture-meta">
            <span class="badge">${escapeHtml(fixture.stage || "Fixture")}</span>
            <span class="badge badge-muted">${source === "live" ? "Live API" : "Fallback"}</span>
          </div>

          <div class="fixture-match" aria-label="${escapeHtml(fixture.homeTeam)} versus ${escapeHtml(fixture.awayTeam)}">
            <div class="fixture-team">
              <span>${escapeHtml(fixture.homeTeam)}</span>
              <span class="fixture-score">${homeScore}</span>
            </div>
            <div class="fixture-team">
              <span>${escapeHtml(fixture.awayTeam)}</span>
              <span class="fixture-score">${awayScore}</span>
            </div>
          </div>

          <div class="fixture-detail">
            <strong>${escapeHtml(fixture.status || "Scheduled")}</strong><br />
            ${date}${time ? ` • ${time}` : ""}<br />
            ${escapeHtml(fixture.venue || "Venue TBC")}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderSquad(players, { source, message }) {
  els.squadStatus.textContent = message;

  els.squadGrid.innerHTML = players.map((player) => {
    const initials = getInitials(player.name);

    return `
      <article class="player-card">
        <div class="player-image">
          ${
            player.image
              ? `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(player.name)}" loading="lazy" />`
              : `<div class="player-placeholder" aria-hidden="true">${escapeHtml(initials)}</div>`
          }
        </div>
        <div class="player-body">
          <h3>${escapeHtml(player.name)}</h3>
          <p>${escapeHtml(player.club || "Club TBC")}</p>
          <div class="player-meta">
            <span>${escapeHtml(player.position || "Player")}</span>
            <span>${source === "live" ? "Live" : "Fallback"}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderStandings(rows, { source, message }) {
  els.standingsStatus.textContent = message;

  const sorted = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  els.standingsTable.innerHTML = `
    <table>
      <caption>${source === "live" ? "Live table data" : "Fallback placeholder table"} for Scotland’s group.</caption>
      <thead>
        <tr>
          <th scope="col">Team</th>
          <th scope="col">P</th>
          <th scope="col">W</th>
          <th scope="col">D</th>
          <th scope="col">L</th>
          <th scope="col">GF</th>
          <th scope="col">GA</th>
          <th scope="col">GD</th>
          <th scope="col">Pts</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((row) => `
          <tr>
            <td>
              <span class="team-cell">
                <span class="team-dot" aria-hidden="true"></span>
                ${escapeHtml(row.team)}
              </span>
            </td>
            <td>${number(row.played)}</td>
            <td>${number(row.won)}</td>
            <td>${number(row.drawn)}</td>
            <td>${number(row.lost)}</td>
            <td>${number(row.gf)}</td>
            <td>${number(row.ga)}</td>
            <td>${signedNumber(row.gd)}</td>
            <td><strong>${number(row.pts)}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* ----------------------------- Mappers ----------------------------- */

function mapApiEvent(event) {
  if (!event) return null;

  return {
    opponent: getOpponent(event),
    homeTeam: event.strHomeTeam || "Home team TBC",
    awayTeam: event.strAwayTeam || "Away team TBC",
    date: event.strTimestamp || combineDateTime(event.dateEvent, event.strTime),
    venue: event.strVenue || event.strCity || "Venue TBC",
    stage: event.strRound || event.strGroup || event.strLeague || "Fixture",
    status: event.strStatus || inferEventStatus(event),
    homeScore: event.intHomeScore,
    awayScore: event.intAwayScore
  };
}

function mapApiPlayer(player) {
  if (!player?.strPlayer) return null;

  return {
    name: player.strPlayer,
    position: player.strPosition || player.strRole || "Player",
    club: player.strTeam || player.strTeam2 || "Club TBC",
    image: player.strCutout || player.strThumb || player.strRender || ""
  };
}

function mapApiTableRow(row) {
  const team = row.strTeam || row.name || row.team;
  if (!team) return null;

  const gf = parseNumber(row.intGoalsFor ?? row.goalsfor ?? row.gf);
  const ga = parseNumber(row.intGoalsAgainst ?? row.goalsagainst ?? row.ga);

  return {
    team,
    played: parseNumber(row.intPlayed ?? row.played),
    won: parseNumber(row.intWin ?? row.intWon ?? row.win),
    drawn: parseNumber(row.intDraw ?? row.draw),
    lost: parseNumber(row.intLoss ?? row.intLost ?? row.loss),
    gf,
    ga,
    gd: parseNumber(row.intGoalDifference ?? row.goalsdifference ?? row.gd ?? gf - ga),
    pts: parseNumber(row.intPoints ?? row.total)
  };
}

/* ----------------------------- Helpers ----------------------------- */

function setApiBanner(message) {
  els.apiBanner.innerHTML = `
    <span class="pulse" aria-hidden="true"></span>
    <span>${escapeHtml(message)}</span>
  `;
}

function isScotlandEvent(event) {
  const text = normalise([
    event.strEvent,
    event.strHomeTeam,
    event.strAwayTeam,
    event.strLeague,
    event.strGroup
  ].filter(Boolean).join(" "));

  return text.includes("scotland");
}

function getOpponent(event) {
  const home = event.strHomeTeam || "";
  const away = event.strAwayTeam || "";
  if (normalise(home).includes("scotland")) return away;
  if (normalise(away).includes("scotland")) return home;
  return event.strEvent || "Opponent TBC";
}

function inferEventStatus(event) {
  const hasScore = event.intHomeScore !== null &&
    event.intHomeScore !== undefined &&
    event.intAwayScore !== null &&
    event.intAwayScore !== undefined;

  return hasScore ? "Result" : "Scheduled";
}

function extractScotlandGroup(rows) {
  const groupWithScotland = rows.find((row) => normalise(row.team).includes("scotland"));
  if (!groupWithScotland) return [];

  /**
   * If TheSportsDB provides a full tournament table without group labels,
   * fall back to known Group C team filtering.
   */
  const groupTeams = ["brazil", "morocco", "haiti", "scotland"];
  const filtered = rows.filter((row) => groupTeams.includes(normalise(row.team)));
  return filtered.length >= 4 ? filtered : rows.slice(0, 4);
}

function sortEventsByDate(a, b) {
  const aTime = new Date(a.strTimestamp || a.dateEvent || 0).getTime();
  const bTime = new Date(b.strTimestamp || b.dateEvent || 0).getTime();
  return aTime - bTime;
}

function combineDateTime(date, time) {
  if (!date) return "";
  if (!time) return date;
  return `${date}T${time}`;
}

function formatDate(value) {
  if (!value) return "Date TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function scoreText(value) {
  if (value === null || value === undefined || value === "") return "–";
  return escapeHtml(String(value));
}

function skeletonCards(count, className) {
  return Array.from({ length: count }, () => `
    <article class="${className}" aria-hidden="true">
      <div style="min-height: 220px; background: linear-gradient(90deg, rgba(255,255,255,.12), rgba(141,216,255,.2), rgba(255,255,255,.12));"></div>
    </article>
  `).join("");
}

function getInitials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function firstArrayItem(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueBy(items, key) {
  const seen = new Set();

  return items.filter((item) => {
    const id = item?.[key] || JSON.stringify(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function number(value) {
  return String(parseNumber(value));
}

function signedNumber(value) {
  const parsed = parseNumber(value);
  return parsed > 0 ? `+${parsed}` : String(parsed);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
