const CONFIG = {
  baseUrl: "https://www.thesportsdb.com/api/v1/json",
  publicKey: "123",
  worldCupLeagueId: "4429",
  season: "2026",
  cacheKey: "scotland-2026-world-cup-cache-v4",
  cacheMinutes: 5,
  refreshMinutes: 5,
  timeoutMs: 10000,
  timeZone: "Europe/London",

  // TheSportsDB World Cup kick-off records are currently displaying one hour behind
  // the published UK schedule, so all visible fixture times are shifted forward here.
  displayOffsetMinutes: 60,
  roundsToProbe: Array.from({ length: 12 }, (_, index) => index + 1)
};

const els = {
  navToggle: document.querySelector(".nav-toggle"),
  navMenu: document.querySelector("#nav-menu"),
  fixtureList: document.querySelector("#fixture-list"),
  groupsGrid: document.querySelector("#groups-grid"),
  knockoutGrid: document.querySelector("#knockout-grid"),
  filterButtons: document.querySelectorAll(".filter-button"),
  year: document.querySelector("#year"),
  heroLastUpdated: document.querySelector("#hero-last-updated"),
  footerLastUpdated: document.querySelector("#footer-last-updated")
};

let state = {
  fixtures: [],
  groups: [],
  knockout: []
};

let refreshTimer = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  setupNavigation();
  setupFilters();

  if (els.year) {
    els.year.textContent = String(new Date().getFullYear());
  }

  renderLoading();
  loadData();
  startAutoRefresh();
}

function setupNavigation() {
  if (!els.navToggle || !els.navMenu) return;

  els.navToggle.addEventListener("click", () => {
    const open = els.navMenu.classList.toggle("is-open");
    els.navToggle.setAttribute("aria-expanded", String(open));
  });

  els.navMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      els.navMenu.classList.remove("is-open");
      els.navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-pressed", "false");
      });

      button.classList.add("is-active");
      button.setAttribute("aria-pressed", "true");
      renderFixtures(button.dataset.filter || "all");
    });
  });
}

function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    if (document.visibilityState === "hidden") return;
    loadData();
  }, CONFIG.refreshMinutes * 60 * 1000);
}

async function loadData() {
  const cached = readCache();

  if (cached && !cacheExpired(cached.fetchedAt)) {
    applyData(cached);
    return;
  }

  try {
    const fresh = await fetchTournamentData();
    writeCache(fresh);
    applyData(fresh);
  } catch (error) {
    console.warn("Fresh tournament data unavailable", error);

    if (cached) {
      applyData(cached);
    } else {
      renderUnavailable();
    }
  }
}

async function fetchTournamentData() {
  const eventRequests = [
    request("eventsseason.php", {
      id: CONFIG.worldCupLeagueId,
      s: CONFIG.season
    }),
    request("eventspastleague.php", {
      id: CONFIG.worldCupLeagueId
    }),
    request("eventsnextleague.php", {
      id: CONFIG.worldCupLeagueId
    }),
    ...CONFIG.roundsToProbe.map((round) =>
      request("eventsround.php", {
        id: CONFIG.worldCupLeagueId,
        r: round,
        s: CONFIG.season
      })
    )
  ];

  const tableRequests = [
    request("lookuptable.php", {
      l: CONFIG.worldCupLeagueId,
      s: CONFIG.season
    })
  ];

  const [eventResults, tableResults] = await Promise.all([
    Promise.allSettled(eventRequests),
    Promise.allSettled(tableRequests)
  ]);

  const rawEvents = uniqueEvents(
    eventResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => extractEvents(result.value))
      .filter(isSeasonEvent)
  );

  const rawTable = tableResults
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => extractTable(result.value));

  if (!rawEvents.length && !rawTable.length) {
    throw new Error("No tournament data returned");
  }

  return {
    fetchedAt: new Date().toISOString(),
    rawEvents,
    rawTable
  };
}

async function request(endpoint, params) {
  const url = new URL(`${CONFIG.baseUrl}/${CONFIG.publicKey}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`${endpoint} failed with HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function applyData(data) {
  const fixtures = data.rawEvents
    .map(mapEvent)
    .filter(Boolean)
    .sort(sortMatches);

  const tableRows = data.rawTable
    .map(mapTableRow)
    .filter(Boolean);

  state = {
    fixtures,
    groups: buildGroups(fixtures, tableRows),
    knockout: fixtures.filter((match) => match.phase === "knockout")
  };

  setLastUpdated(data.fetchedAt);
  renderFixtures(activeFilter());
  renderGroups();
  renderKnockout();
  renderHero(fixtures);
}

function extractEvents(payload) {
  if (!payload) return [];

  return [
    ...arr(payload.events),
    ...arr(payload.event),
    ...arr(payload.results)
  ].filter(Boolean);
}

function extractTable(payload) {
  if (!payload) return [];

  return [
    ...arr(payload.table),
    ...arr(payload.tables)
  ].filter(Boolean);
}

function uniqueEvents(events) {
  const seen = new Set();

  return events.filter((event) => {
    const key = clean(event.idEvent) ||
      [
        clean(event.dateEvent),
        clean(event.strTime),
        clean(event.strHomeTeam),
        clean(event.strAwayTeam),
        clean(event.strEvent)
      ].join("|");

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function isSeasonEvent(event) {
  const date = kickoffDate(event);

  if (!date) {
    return clean(event.strSeason) === CONFIG.season;
  }

  return String(date.getUTCFullYear()) === CONFIG.season;
}

function mapEvent(event) {
  const parsedTeams = parseTeamsFromEventName(event.strEvent || event.strEventAlternate || "");
  const home = clean(event.strHomeTeam) || parsedTeams.home || clean(event.strEvent) || "Fixture TBC";
  const away = clean(event.strAwayTeam) || parsedTeams.away || "Opponent TBC";
  const stage = stageName(event);
  const group = groupName([event.strGroup, event.strRound, event.strStage, event.strEvent].join(" "));
  const phase = isKnockoutStage(stage) ? "knockout" : "group";

  return {
    id: clean(event.idEvent) || `${home}-${away}-${event.dateEvent}-${event.strTime}`,
    phase,
    stage: group || stage,
    group,
    home,
    away,
    venue: clean([event.strVenue, event.strCity].filter(Boolean).join(", ")) || "Venue TBC",
    kickoff: kickoffDate(event),
    score: score(event),
    status: score(event) ? "Result" : clean(event.strStatus || "Scheduled")
  };
}

function parseTeamsFromEventName(value) {
  const eventName = clean(value);
  if (!eventName) return { home: "", away: "" };

  const parts = eventName.split(/\s+(?:vs?\.?|v)\s+/i);
  if (parts.length < 2) return { home: "", away: "" };

  return {
    home: clean(parts[0]),
    away: clean(parts.slice(1).join(" v "))
  };
}

function stageName(event) {
  return clean(
    event.strRound ||
    event.strStage ||
    event.strGroup ||
    event.strLeague ||
    "Fixture"
  );
}

function mapTableRow(row) {
  const team = clean(row.strTeam || row.name || row.team);
  if (!team) return null;

  const gf = number(row.intGoalsFor ?? row.goalsfor ?? row.gf);
  const ga = number(row.intGoalsAgainst ?? row.goalsagainst ?? row.ga);

  return {
    team,
    group: groupName(row.strGroup || row.strDescription || row.strLeague || row.strTable || ""),
    played: number(row.intPlayed ?? row.played),
    won: number(row.intWin ?? row.intWon ?? row.win),
    drawn: number(row.intDraw ?? row.draw),
    lost: number(row.intLoss ?? row.intLost ?? row.loss),
    gf,
    ga,
    gd: number(row.intGoalDifference ?? row.goalsdifference ?? row.gd ?? gf - ga),
    pts: number(row.intPoints ?? row.total ?? row.points)
  };
}

function buildGroups(fixtures, tableRows) {
  const groups = new Map();

  fixtures
    .filter((match) => match.phase === "group")
    .forEach((match) => {
      const name = match.group || match.stage;
      if (!/^Group\s+[A-L]$/i.test(name)) return;

      if (!groups.has(name)) {
        groups.set(name, new Map());
      }

      addBlank(groups.get(name), match.home);
      addBlank(groups.get(name), match.away);
    });

  tableRows.forEach((row) => {
    const name = row.group || findGroup(groups, row.team);
    if (!name) return;

    if (!groups.has(name)) {
      groups.set(name, new Map());
    }

    groups.get(name).set(row.team, { ...blankStanding(row.team), ...row });
  });

  return [...groups.entries()]
    .map(([name, teams]) => ({
      name,
      teams: [...teams.values()].sort(sortStandings)
    }))
    .sort((a, b) => orderGroup(a.name) - orderGroup(b.name));
}

function addBlank(group, team) {
  if (!group.has(team)) {
    group.set(team, blankStanding(team));
  }
}

function findGroup(groups, team) {
  for (const [name, teams] of groups.entries()) {
    if (teams.has(team)) return name;
  }

  return "";
}

function blankStanding(team) {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  };
}

function renderLoading() {
  if (els.fixtureList) {
    els.fixtureList.innerHTML = `<div class="empty-state">Loading fixtures…</div>`;
  }

  if (els.groupsGrid) {
    els.groupsGrid.innerHTML = `<div class="empty-state">Loading groups…</div>`;
  }

  if (els.knockoutGrid) {
    els.knockoutGrid.innerHTML = `<div class="empty-state">Loading knockout path…</div>`;
  }
}

function renderUnavailable() {
  setLastUpdated("");

  if (els.fixtureList) {
    els.fixtureList.innerHTML = `<div class="empty-state">Tournament data is not available right now.</div>`;
  }

  if (els.groupsGrid) {
    els.groupsGrid.innerHTML = `<div class="empty-state">Group data is not available right now.</div>`;
  }

  if (els.knockoutGrid) {
    els.knockoutGrid.innerHTML = `<div class="empty-state">Knockout data is not available right now.</div>`;
  }
}

function renderFixtures(filter) {
  if (!els.fixtureList) return;

  const fixtures = state.fixtures.filter((match) => {
    if (filter === "scotland") return isScotland(match);
    if (filter === "group") return match.phase === "group";
    if (filter === "knockout") return match.phase === "knockout";
    return true;
  });

  if (!fixtures.length) {
    els.fixtureList.innerHTML = `<div class="empty-state">No fixtures are available for this filter yet.</div>`;
    return;
  }

  els.fixtureList.innerHTML = fixtures.map(renderFixtureCard).join("");
}

function renderFixtureCard(match) {
  return `
    <article class="fixture-card ${isScotland(match) ? "is-scotland" : ""}">
      <div class="fixture-date">
        ${shortDate(match.kickoff)}
        <strong>${kickoffTime(match.kickoff)}</strong>
      </div>

      <div class="fixture-main">
        <span class="fixture-stage">${escapeHtml(match.stage)}</span>
        <div class="fixture-teams">
          <span>${escapeHtml(match.home)}</span>
          ${match.score ? `<span class="fixture-score">${escapeHtml(match.score)}</span>` : `<span aria-hidden="true">v</span>`}
          <span>${escapeHtml(match.away)}</span>
        </div>
        <div class="fixture-meta">${escapeHtml(match.venue)}</div>
      </div>

      <span class="fixture-status">${escapeHtml(match.status)}</span>
    </article>`;
}

function renderGroups() {
  if (!els.groupsGrid) return;

  if (!state.groups.length) {
    els.groupsGrid.innerHTML = `<div class="empty-state">Group tables are not available right now.</div>`;
    return;
  }

  els.groupsGrid.innerHTML = state.groups.map((group) => `
    <article class="group-card">
      <div class="group-header">
        <span class="group-label">${escapeHtml(group.name)}</span>
        <span class="group-label">P W D L GD Pts</span>
      </div>

      <table>
        <thead>
          <tr>
            <th scope="col">Team</th>
            <th scope="col">P</th>
            <th scope="col">W</th>
            <th scope="col">D</th>
            <th scope="col">L</th>
            <th scope="col">GD</th>
            <th scope="col">Pts</th>
          </tr>
        </thead>
        <tbody>${group.teams.map(renderGroupRow).join("")}</tbody>
      </table>
    </article>`).join("");
}

function renderGroupRow(row) {
  return `
    <tr class="${clean(row.team).toLowerCase() === "scotland" ? "is-scotland" : ""}">
      <td>
        <span class="team-name">
          <span class="team-dot" aria-hidden="true"></span>
          ${escapeHtml(row.team)}
        </span>
      </td>
      <td>${number(row.played)}</td>
      <td>${number(row.won)}</td>
      <td>${number(row.drawn)}</td>
      <td>${number(row.lost)}</td>
      <td>${goalDiff(number(row.gd))}</td>
      <td><strong>${number(row.pts)}</strong></td>
    </tr>`;
}

function renderKnockout() {
  if (!els.knockoutGrid) return;

  if (!state.knockout.length) {
    els.knockoutGrid.innerHTML = `<div class="empty-state">Knockout fixtures are not available right now.</div>`;
    return;
  }

  els.knockoutGrid.innerHTML = state.knockout.map((match) => `
    <article class="knockout-card">
      <span class="knockout-round">${escapeHtml(match.stage)}</span>
      <h3>${escapeHtml(match.home)} v ${escapeHtml(match.away)}</h3>
      <p><strong>${shortDate(match.kickoff)} • ${kickoffTime(match.kickoff)}</strong></p>
      <p>${escapeHtml(match.venue)}</p>
    </article>`).join("");
}

function renderHero(fixtures) {
  const box = document.querySelector(".scoreboard-grid");
  if (!box) return;

  const now = Date.now();
  const next = fixtures.find((match) => {
    return isScotland(match) && match.kickoff && displayDate(match.kickoff).getTime() >= now;
  });

  const latest = [...fixtures].reverse().find((match) => isScotland(match));
  const match = next || latest;

  if (!match) {
    box.innerHTML = `
      <div><span>Scotland match</span><strong>Not available</strong></div>
      <div><span>Kick-off</span><strong>Not available</strong></div>
      <div><span>Venue</span><strong>Not available</strong></div>`;
    return;
  }

  box.innerHTML = `
    <div>
      <span>${next ? "Next Scotland match" : "Latest Scotland match"}</span>
      <strong>${escapeHtml(match.home)} v ${escapeHtml(match.away)}</strong>
    </div>
    <div>
      <span>Kick-off</span>
      <strong>${shortDate(match.kickoff)} • ${kickoffTime(match.kickoff)}</strong>
    </div>
    <div>
      <span>Venue</span>
      <strong>${escapeHtml(match.venue)}</strong>
    </div>`;
}

function kickoffDate(event) {
  const timestamp = clean(event.strTimestamp);

  if (timestamp) {
    const normalised = normaliseApiTimestamp(timestamp);
    const date = new Date(normalised);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (event.dateEvent && event.strTime) {
    const date = new Date(`${event.dateEvent}T${normaliseApiTime(event.strTime)}`);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (event.dateEvent) {
    const date = new Date(`${event.dateEvent}T12:00:00Z`);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function normaliseApiTimestamp(value) {
  let timestamp = clean(value).replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
    timestamp += "T00:00:00";
  }

  if (!hasTimeZoneSuffix(timestamp)) {
    timestamp += "Z";
  }

  return timestamp;
}

function normaliseApiTime(value) {
  const time = clean(value).replace(/\s/g, "");

  if (hasTimeZoneSuffix(time)) {
    return time;
  }

  return `${time.replace(/Z$/i, "")}Z`;
}

function hasTimeZoneSuffix(value) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(clean(value));
}

function displayDate(date) {
  if (!date) return null;
  return new Date(date.getTime() + CONFIG.displayOffsetMinutes * 60 * 1000);
}

function shortDate(date) {
  const shownDate = displayDate(date);
  if (!shownDate) return "Date TBC";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CONFIG.timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(shownDate);
}

function kickoffTime(date) {
  const shownDate = displayDate(date);
  if (!shownDate) return "Time TBC";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CONFIG.timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  })
    .format(shownDate)
    .replace(" am", "am")
    .replace(" pm", "pm");
}

function setLastUpdated(value) {
  const text = value
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: CONFIG.timeZone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short"
      }).format(new Date(value))
    : "Not available";

  [els.heroLastUpdated, els.footerLastUpdated].forEach((el) => {
    if (!el) return;

    el.textContent = text;
    el.dateTime = value || "";
  });
}

function readCache() {
  try {
    const raw = localStorage.getItem(CONFIG.cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in restricted browsing modes.
  }
}

function cacheExpired(value) {
  const fetched = new Date(value).getTime();
  return !Number.isFinite(fetched) || Date.now() - fetched >= CONFIG.cacheMinutes * 60 * 1000;
}

function score(event) {
  if (event.intHomeScore === null || event.intHomeScore === undefined || event.intHomeScore === "") return "";
  if (event.intAwayScore === null || event.intAwayScore === undefined || event.intAwayScore === "") return "";

  return `${event.intHomeScore}-${event.intAwayScore}`;
}

function groupName(value) {
  const match = String(value || "").match(/Group\s+([A-L])/i);
  return match ? `Group ${match[1].toUpperCase()}` : "";
}

function isKnockoutStage(stage) {
  return /round of 32|round of 16|last 16|quarter|semi|bronze|third place|third-place|final/i.test(stage);
}

function isScotland(match) {
  return clean(match.home).toLowerCase() === "scotland" ||
    clean(match.away).toLowerCase() === "scotland";
}

function sortMatches(a, b) {
  return (a.kickoff ? displayDate(a.kickoff).getTime() : Number.MAX_SAFE_INTEGER) -
    (b.kickoff ? displayDate(b.kickoff).getTime() : Number.MAX_SAFE_INTEGER);
}

function sortStandings(a, b) {
  if (b.pts !== a.pts) return b.pts - a.pts;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;

  return a.team.localeCompare(b.team);
}

function orderGroup(name) {
  const match = String(name).match(/Group\s+([A-L])/i);
  return match ? match[1].toUpperCase().charCodeAt(0) - 65 : 999;
}

function activeFilter() {
  return [...els.filterButtons].find((button) => {
    return button.classList.contains("is-active");
  })?.dataset.filter || "all";
}

function goalDiff(value) {
  return value > 0 ? `+${value}` : String(value);
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value || "").trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}
