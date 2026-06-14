(() => {
  "use strict";

  const ACTIVE_CACHE_KEY = "scotland-2026-world-cup-cache-v38";
  const CACHE_PREFIX = "scotland-2026-world-cup-cache-v";
  const THEME_KEY = "scotland-2026-theme";
  const THEME_MANUAL_UNTIL_KEY = "scotland-2026-theme-manual-until";
  const DARK_START_HOUR = 22;
  const LIGHT_START_HOUR = 8;

  installThemeStyles();
  applyStoredTheme();
  document.addEventListener("DOMContentLoaded", () => {
    setupThemeToggle();
    scheduleThemeAutomation();
  });

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = ACTIVE_CACHE_KEY;
  }

  window.mapEvent = function mapEvent(event) {
    const parsedTeams = parseTeamsFromEventName(event.strEvent || event.strEventAlternate || "");
    const home = clean(event.strHomeTeam) || parsedTeams.home || clean(event.strEvent) || "Fixture TBC";
    const away = clean(event.strAwayTeam) || parsedTeams.away || "Opponent TBC";
    const group = groupName([
      event.strGroup,
      event.strRound,
      event.strStage,
      event.strEvent,
      event.strEventAlternate,
      event.strDescriptionEN,
      event.strDescription
    ].join(" "));
    const stage = group || stageName(event);
    const phase = isKnockoutStage([
      stage,
      event.strRound,
      event.strStage,
      event.strEvent,
      event.strEventAlternate
    ].join(" ")) ? "knockout" : "group";
    const matchScore = score(event);
    const status = matchStatus(event, matchScore);

    return {
      id: clean(event.idEvent) || `${home}-${away}-${event.dateEvent}-${event.strTime}`,
      phase,
      stage,
      group,
      home,
      away,
      venue: clean([event.strVenue, event.strCity].filter(Boolean).join(", ")) || "Venue TBC",
      kickoff: kickoffDate(event),
      score: matchScore,
      status,
      isLive: isLiveMatchStatus(status)
    };
  };

  window.matchStatus = function matchStatus(event, matchScore) {
    const status = rawMatchStatus(event).toLowerCase();

    if (isFinishedStatus(status)) return "FT";
    if (isPenaltyStatus(status)) return "PEN";
    if (isExtraSecondHalfStatus(status)) return "ET2H";
    if (isExtraFirstHalfStatus(status)) return "ET1H";
    if (isHalfTimeStatus(status)) return "HT";
    if (isSecondHalfStatus(status)) return "2H";
    if (isFirstHalfStatus(status)) return "1H";
    if (isLiveStatus(status) || appearsInPlay(event)) return "1H";
    if (matchScore) return "FT";

    return "NS";
  };

  window.isLiveStatus = function isLiveStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(live|in play|in-play|playing|1h|2h|ht|et|et1h|et2h|pen|pens|penalties)$/i.test(status) ||
      /\blive\b|in progress|in-play|in play|first half|second half|half.?time|extra time|penalt|shootout/i.test(status);
  };

  window.isFinishedStatus = function isFinishedStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(ft|full time|full-time|finished|match finished|ended|after extra time|aet|after penalties|ap)$/i.test(status) ||
      /full.?time|finished|match ended|after extra time|after penalties|result/i.test(status);
  };

  window.startAutoRefresh = function startAutoRefresh() {
    const refreshMs = Math.max(1, CONFIG.refreshMinutes || 5) * 60 * 1000;

    window.clearInterval(window.__scotland2026RefreshTimer);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible" && typeof loadData === "function") {
        loadData();
      }
    };

    window.__scotland2026RefreshTimer = window.setInterval(refreshWhenVisible, refreshMs);

    if (!window.__scotland2026VisibilityRefreshBound) {
      document.addEventListener("visibilitychange", refreshWhenVisible);
      window.addEventListener("online", refreshWhenVisible);
      window.__scotland2026VisibilityRefreshBound = true;
    }
  };

  if (typeof loadData === "function") {
    loadData = loadDataWithBackfill;
    window.loadData = loadDataWithBackfill;
  }

  if (typeof readCache === "function") {
    readCache = readBestCache;
    window.readCache = readBestCache;
  }

  if (typeof writeCache === "function") {
    writeCache = writeMergedCache;
    window.writeCache = writeMergedCache;
  }

  if (typeof renderGroupCard === "function") {
    renderGroupCard = renderCleanGroupCard;
    window.renderGroupCard = renderCleanGroupCard;
  }

  if (typeof renderGroupRow === "function") {
    renderGroupRow = renderLiveAwareGroupRow;
    window.renderGroupRow = renderLiveAwareGroupRow;
  }

  function installThemeStyles() {
    if (document.querySelector("#scotland-theme-styles")) return;

    const style = document.createElement("style");
    style.id = "scotland-theme-styles";
    style.textContent = `
      .theme-toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.52rem;
        min-height: 42px;
        margin-left: auto;
        padding: 0.32rem 0.42rem 0.32rem 0.76rem;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.88);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        cursor: pointer;
        font-size: 0.72rem;
        font-weight: 950;
        letter-spacing: 0.1em;
        line-height: 1;
        text-transform: uppercase;
        transition: border-color var(--transition), background var(--transition), transform var(--transition);
      }

      .theme-toggle:hover,
      .theme-toggle:focus-visible {
        transform: translateY(-1px);
        border-color: rgba(141, 216, 255, 0.45);
        background: rgba(141, 216, 255, 0.14);
        outline: none;
      }

      .theme-toggle__track {
        position: relative;
        width: 2.45rem;
        height: 1.45rem;
        border-radius: 999px;
        background: rgba(141, 216, 255, 0.24);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
      }

      .theme-toggle__thumb {
        position: absolute;
        top: 0.22rem;
        left: 0.24rem;
        width: 1rem;
        height: 1rem;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 5px 12px rgba(3, 11, 29, 0.24);
        transition: transform 220ms cubic-bezier(.2,.85,.2,1), background 220ms ease;
      }

      html[data-theme="dark"] .theme-toggle__thumb {
        transform: translateX(0.95rem);
        background: var(--sky-300);
      }

      html[data-theme="dark"] {
        color-scheme: dark;
        --ink: #eef6ff;
        --muted: #b8c6d8;
        --paper: #071226;
        --cream: #0b1730;
        --line: rgba(185, 232, 255, 0.18);
      }

      html[data-theme="dark"] body {
        color: #edf7ff;
        background:
          radial-gradient(circle at 12% 4%, rgba(141, 216, 255, 0.18), transparent 30rem),
          radial-gradient(circle at 90% 22%, rgba(18, 51, 109, 0.5), transparent 24rem),
          linear-gradient(180deg, #020817 0%, #071226 48%, #020817 100%);
      }

      html[data-theme="dark"] body::before {
        opacity: 0.18;
        background-image:
          linear-gradient(rgba(141, 216, 255, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(141, 216, 255, 0.08) 1px, transparent 1px);
      }

      html[data-theme="dark"] .section-heading h2,
      html[data-theme="dark"] .match-details-header h3 {
        color: #f5fbff;
      }

      html[data-theme="dark"] .section-heading p,
      html[data-theme="dark"] .knockout-card p,
      html[data-theme="dark"] .empty-state {
        color: rgba(237, 247, 255, 0.74);
      }

      html[data-theme="dark"] .eyebrow {
        color: var(--sky-200);
      }

      html[data-theme="dark"] .quick-info,
      html[data-theme="dark"] .today-fixtures-section,
      html[data-theme="dark"] .section:not(.hero):not(.section-navy) {
        background: transparent;
      }

      html[data-theme="dark"] .stat-card,
      html[data-theme="dark"] .fixture-day-heading,
      html[data-theme="dark"] .fixture-day-card,
      html[data-theme="dark"] .fixture-list .fixture-card,
      html[data-theme="dark"] .fixture-card.is-compact,
      html[data-theme="dark"] .group-card,
      html[data-theme="dark"] .knockout-card,
      html[data-theme="dark"] .empty-state {
        border-color: rgba(185, 232, 255, 0.14);
        color: #edf7ff;
        background:
          linear-gradient(135deg, rgba(141, 216, 255, 0.08), transparent 42%),
          rgba(8, 21, 45, 0.82);
        box-shadow: 0 22px 54px rgba(0, 0, 0, 0.26);
      }

      html[data-theme="dark"] .fixture-list .fixture-card:hover,
      html[data-theme="dark"] .fixture-list .fixture-card:focus-visible {
        background:
          linear-gradient(90deg, rgba(141, 216, 255, 0.16), transparent 46%),
          rgba(10, 27, 58, 0.94);
        box-shadow: inset 4px 0 0 rgba(141, 216, 255, 0.8), 0 18px 42px rgba(0, 0, 0, 0.28);
      }

      html[data-theme="dark"] .fixture-list .fixture-card.is-scotland,
      html[data-theme="dark"] .fixture-card.is-scotland {
        background:
          linear-gradient(90deg, rgba(141, 216, 255, 0.2), transparent 48%),
          rgba(9, 25, 54, 0.94);
      }

      html[data-theme="dark"] .fixture-row-stage,
      html[data-theme="dark"] .fixture-row-time,
      html[data-theme="dark"] .fixture-row-team,
      html[data-theme="dark"] .team-name,
      html[data-theme="dark"] .group-card td,
      html[data-theme="dark"] .group-card th {
        color: rgba(237, 247, 255, 0.78);
      }

      html[data-theme="dark"] .fixture-row-team.is-leading,
      html[data-theme="dark"] .group-card td:first-child,
      html[data-theme="dark"] .group-card strong {
        color: #ffffff;
      }

      html[data-theme="dark"] .fixture-row-time span {
        background: rgba(141, 216, 255, 0.1);
      }

      html[data-theme="dark"] .section-navy {
        background:
          radial-gradient(circle at 12% 18%, rgba(141, 216, 255, 0.15), transparent 26rem),
          linear-gradient(180deg, #030b1d, #06142d);
      }

      html[data-theme="dark"] .group-card tbody tr.is-playing {
        background: linear-gradient(90deg, rgba(254, 226, 226, 0.18), rgba(141, 216, 255, 0.08));
      }

      @media (max-width: 720px) {
        .theme-toggle {
          margin-left: 0;
          padding-left: 0.64rem;
        }

        .theme-toggle__label {
          display: none;
        }
      }
    `;

    document.head.append(style);
  }

  function applyStoredTheme() {
    const manualUntil = readManualThemeUntil();

    if (manualUntil > Date.now()) {
      setTheme(readStoredTheme() || scheduledTheme(), { persist: false });
      return;
    }

    clearManualTheme();
    applyScheduledTheme({ force: true });
  }

  function setupThemeToggle() {
    const nav = document.querySelector(".nav");
    const navMenu = document.querySelector("#nav-menu");
    if (!nav || !navMenu || document.querySelector("#theme-toggle")) return;

    const button = document.createElement("button");
    button.id = "theme-toggle";
    button.className = "theme-toggle";
    button.type = "button";
    button.innerHTML = `
      <span class="theme-toggle__label">Dark</span>
      <span class="theme-toggle__track" aria-hidden="true"><span class="theme-toggle__thumb"></span></span>
    `;

    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      const manualUntil = nextThemeBoundary().getTime();
      setTheme(nextTheme, { persist: true, manualUntil });
    });

    nav.insertBefore(button, navMenu);
    syncThemeToggle(button);
  }

  function scheduleThemeAutomation() {
    window.clearInterval(window.__scotlandThemeScheduleTimer);
    window.__scotlandThemeScheduleTimer = window.setInterval(applyScheduledTheme, 60 * 1000);

    if (!window.__scotlandThemeVisibilityBound) {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") applyScheduledTheme();
      });
      window.__scotlandThemeVisibilityBound = true;
    }

    applyScheduledTheme();
  }

  function applyScheduledTheme(options = {}) {
    const manualUntil = readManualThemeUntil();

    if (!options.force && manualUntil > Date.now()) return;

    clearManualTheme();
    setTheme(scheduledTheme(), { persist: false });
  }

  function scheduledTheme(date = new Date()) {
    const hour = date.getHours();
    return hour >= DARK_START_HOUR || hour < LIGHT_START_HOUR ? "dark" : "light";
  }

  function nextThemeBoundary(from = new Date()) {
    const nextLight = new Date(from);
    nextLight.setHours(LIGHT_START_HOUR, 0, 0, 0);
    if (nextLight <= from) nextLight.setDate(nextLight.getDate() + 1);

    const nextDark = new Date(from);
    nextDark.setHours(DARK_START_HOUR, 0, 0, 0);
    if (nextDark <= from) nextDark.setDate(nextDark.getDate() + 1);

    return nextLight < nextDark ? nextLight : nextDark;
  }

  function setTheme(theme, options = {}) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", nextTheme === "dark" ? "#020817" : "#071a3d");
    }

    if (options.persist) {
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
        if (options.manualUntil) {
          localStorage.setItem(THEME_MANUAL_UNTIL_KEY, String(options.manualUntil));
        }
      } catch {
        // localStorage may be unavailable in restricted browsing modes.
      }
    }

    syncThemeToggle(document.querySelector("#theme-toggle"));
  }

  function readStoredTheme() {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === "dark" || value === "light" ? value : "";
    } catch {
      return "";
    }
  }

  function readManualThemeUntil() {
    try {
      return Number(localStorage.getItem(THEME_MANUAL_UNTIL_KEY) || 0);
    } catch {
      return 0;
    }
  }

  function clearManualTheme() {
    try {
      localStorage.removeItem(THEME_MANUAL_UNTIL_KEY);
    } catch {
      // localStorage may be unavailable in restricted browsing modes.
    }
  }

  function syncThemeToggle(button) {
    if (!button) return;

    const isDark = document.documentElement.dataset.theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Switch to light mode until the next automatic change" : "Switch to dark mode until the next automatic change");
    const label = button.querySelector(".theme-toggle__label");
    if (label) label.textContent = isDark ? "Light" : "Dark";
  }

  async function loadDataWithBackfill() {
    CONFIG.cacheKey = ACTIVE_CACHE_KEY;
    const cached = readBestCache();

    if (cached && !cacheExpired(cached.fetchedAt) && hasEnoughTournamentData(cached)) {
      applyData(cached);
      return;
    }

    try {
      const fresh = await fetchTournamentData();
      const merged = mergeTournamentData(fresh, cached);
      writeMergedCache(merged);
      applyData(merged);
    } catch (error) {
      console.warn("Fresh tournament data unavailable", error);

      if (cached) {
        applyData(cached);
      } else {
        renderUnavailable();
      }
    }
  }

  function readBestCache() {
    try {
      const caches = cacheKeys()
        .map((key) => parseCachedValue(localStorage.getItem(key)))
        .filter(Boolean)
        .sort(scoreCachedData);

      return caches[0] || null;
    } catch {
      return null;
    }
  }

  function writeMergedCache(data) {
    try {
      CONFIG.cacheKey = ACTIVE_CACHE_KEY;
      localStorage.setItem(ACTIVE_CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable in restricted browsing modes.
    }
  }

  function mergeTournamentData(fresh, cached) {
    if (!cached) return fresh;

    const rawEvents = uniqueEvents([
      ...safeArray(fresh.rawEvents),
      ...safeArray(cached.rawEvents)
    ]);
    const rawTable = uniqueTableRows([
      ...safeArray(fresh.rawTable),
      ...safeArray(cached.rawTable)
    ]);

    return {
      fetchedAt: fresh.fetchedAt || new Date().toISOString(),
      rawEvents,
      rawTable
    };
  }

  function cacheKeys() {
    const keys = [ACTIVE_CACHE_KEY];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX) && !keys.includes(key)) {
        keys.push(key);
      }
    }

    return keys;
  }

  function parseCachedValue(value) {
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      if (!parsed || !Array.isArray(parsed.rawEvents) || !Array.isArray(parsed.rawTable)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function scoreCachedData(a, b) {
    const aScore = cacheDataScore(a);
    const bScore = cacheDataScore(b);

    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.fetchedAt || 0).getTime() - new Date(a.fetchedAt || 0).getTime();
  }

  function cacheDataScore(data) {
    return safeArray(data.rawEvents).length + safeArray(data.rawTable).length * 2;
  }

  function hasEnoughTournamentData(data) {
    return safeArray(data.rawEvents).length >= 24 || safeArray(data.rawTable).length >= 24;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function renderCleanGroupCard(group) {
    const body = group.teams.length
      ? group.teams.map(renderGroupRow).join("")
      : `<tr><td class="group-empty" colspan="9">Awaiting API group teams</td></tr>`;

    return `
      <article class="group-card">
        <div class="group-header">
          <span class="group-label">${escapeHtml(group.name)}</span>
        </div>

        <table>
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
          <tbody>${body}</tbody>
        </table>
      </article>`;
  }

  function renderLiveAwareGroupRow(row) {
    const isScotlandRow = normalise(row.team) === "scotland";
    const isLiveRow = liveTeamNames().has(normaliseTeamName(row.team));
    const classes = [isScotlandRow ? "is-scotland" : "", isLiveRow ? "is-playing" : ""]
      .filter(Boolean)
      .join(" ");
    const liveMarker = isLiveRow ? `<span class="standings-live-marker" aria-label="Currently playing">Live</span>` : "";

    return `
      <tr class="${classes}">
        <td>
          <span class="team-name">
            <span class="team-dot" aria-hidden="true"></span>
            ${escapeHtml(row.team)}
            ${liveMarker}
          </span>
        </td>
        <td>${number(row.played)}</td>
        <td>${number(row.won)}</td>
        <td>${number(row.drawn)}</td>
        <td>${number(row.lost)}</td>
        <td>${number(row.gf)}</td>
        <td>${number(row.ga)}</td>
        <td>${goalDiff(number(row.gd))}</td>
        <td><strong>${number(row.pts)}</strong></td>
      </tr>`;
  }

  function liveTeamNames() {
    const teams = new Set();

    if (typeof state === "undefined" || !state?.fixtures) return teams;

    state.fixtures.forEach((match) => {
      if (!match.isLive && !isLiveMatchStatus(match.status)) return;
      teams.add(normaliseTeamName(match.home));
      teams.add(normaliseTeamName(match.away));
    });

    return teams;
  }

  function normaliseTeamName(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/\bthe\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function rawMatchStatus(event) {
    return clean([
      event.strStatus,
      event.strProgress,
      event.strLive,
      event.status,
      event.strClock,
      event.strTimeLine,
      event.strPeriod
    ].filter(Boolean).join(" "));
  }

  function isLiveMatchStatus(value) {
    return /^(1H|HT|2H|ET1H|ET2H|PEN)$/i.test(clean(value));
  }

  function isFirstHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(1h|1st half|first half|first-half|1st)$/i.test(status) || /\b(1h|1st half|first half|first-half)\b/.test(status);
  }

  function isHalfTimeStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(ht|half time|half-time|halftime)$/i.test(status) || /\bhalf.?time\b/.test(status);
  }

  function isSecondHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(2h|2nd half|second half|second-half|2nd)$/i.test(status) || /\b(2h|2nd half|second half|second-half)\b/.test(status);
  }

  function isExtraFirstHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(et1h|et 1h|extra time 1h|extra time first half|first half extra time|1st half extra time)$/i.test(status) || /\b(et1h|et 1h|extra time first half|first half extra time|1st half extra time)\b/.test(status);
  }

  function isExtraSecondHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(et2h|et 2h|extra time 2h|extra time second half|second half extra time|2nd half extra time)$/i.test(status) || /\b(et2h|et 2h|extra time second half|second half extra time|2nd half extra time)\b/.test(status);
  }

  function isPenaltyStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return /^(pen|pens|penalties|penalty|penalty shootout|shootout)$/i.test(status) || /\bpenalt|shootout/.test(status);
  }

  function appearsInPlay(event) {
    if (typeof kickoffDate !== "function") return false;

    const kickoff = kickoffDate(event);
    if (!kickoff) return false;

    const now = Date.now();
    const startWindow = kickoff.getTime();
    const endWindow = kickoff.getTime() + 3.25 * 60 * 60 * 1000;

    return now >= startWindow && now <= endWindow;
  }
})();