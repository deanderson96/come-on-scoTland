(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v34";
  }

  const GROUP_TEAMS = {
    A: ["Mexico", "South Africa", "South Korea", "Czechia"],
    B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    C: ["Brazil", "Morocco", "Haiti", "Scotland"],
    D: ["United States", "Paraguay", "Australia", "Turkey"],
    E: ["Germany", "Curacao", "Curaçao", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    I: ["France", "Senegal", "Iraq", "Norway"],
    J: ["Argentina", "Algeria", "Austria", "Jordan"],
    K: ["Portugal", "DR Congo", "Democratic Republic of the Congo", "Uzbekistan", "Colombia"],
    L: ["England", "Croatia", "Ghana", "Panama"]
  };

  const TEAM_TO_GROUP = Object.entries(GROUP_TEAMS).reduce((lookup, [group, teams]) => {
    teams.forEach((team) => {
      lookup.set(normaliseTeamName(team), `Group ${group}`);
    });
    return lookup;
  }, new Map());

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
    ].join(" ")) || inferGroupFromTeams(home, away);
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

  if (typeof renderGroupCard === "function") {
    renderGroupCard = renderCleanGroupCard;
    window.renderGroupCard = renderCleanGroupCard;
  }

  if (typeof renderGroupRow === "function") {
    renderGroupRow = renderLiveAwareGroupRow;
    window.renderGroupRow = renderLiveAwareGroupRow;
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

    if (!window.state && typeof state === "undefined") return teams;

    (state.fixtures || []).forEach((match) => {
      if (!match.isLive && !isLiveMatchStatus(match.status)) return;
      teams.add(normaliseTeamName(match.home));
      teams.add(normaliseTeamName(match.away));
    });

    return teams;
  }

  function inferGroupFromTeams(home, away) {
    const homeGroup = TEAM_TO_GROUP.get(normaliseTeamName(home));
    const awayGroup = TEAM_TO_GROUP.get(normaliseTeamName(away));

    if (homeGroup && homeGroup === awayGroup) return homeGroup;
    return homeGroup || awayGroup || "";
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