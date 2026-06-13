(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v17";
  }

  const teamFilterState = {
    teams: new Set(),
    selected: ""
  };

  const matchDetailsCache = new Map();

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

  window.renderFixtureCard = function renderFixtureCard(match) {
    const liveIndicator = match.isLive
      ? `<span class="fixture-live-indicator" aria-label="Live match"><span aria-hidden="true"></span>Live</span>`
      : "";
    const panelId = `match-details-${slugify(match.id)}`;

    return `
      <article class="fixture-card ${isScotland(match) ? "is-scotland" : ""} ${match.isLive ? "is-live" : ""}" role="button" tabindex="0" aria-expanded="false" aria-controls="${panelId}" data-event-id="${escapeHtml(match.id)}" data-home-team="${escapeHtml(match.home)}" data-away-team="${escapeHtml(match.away)}" data-stage="${escapeHtml(match.stage)}" data-venue="${escapeHtml(match.venue)}" data-kickoff="${match.kickoff ? match.kickoff.toISOString() : ""}" data-status="${escapeHtml(match.status)}" data-score="${escapeHtml(match.score || "")}">
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

        <div class="fixture-status-stack">
          ${liveIndicator}
          <span class="fixture-status ${statusClass(match.status)}">${escapeHtml(match.status)}</span>
        </div>
      </article>`;
  };

  window.matchStatus = function matchStatus(event, matchScore) {
    const status = rawMatchStatus(event).toLowerCase();

    if (isFinishedStatus(status)) {
      return "FT";
    }

    if (isPenaltyStatus(status)) {
      return "PEN";
    }

    if (isExtraSecondHalfStatus(status)) {
      return "ET2H";
    }

    if (isExtraFirstHalfStatus(status)) {
      return "ET1H";
    }

    if (isHalfTimeStatus(status)) {
      return "HT";
    }

    if (isSecondHalfStatus(status)) {
      return "2H";
    }

    if (isFirstHalfStatus(status)) {
      return "1H";
    }

    if (isLiveStatus(status) || appearsInPlay(event)) {
      return "1H";
    }

    if (matchScore) {
      return "FT";
    }

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

  document.addEventListener("DOMContentLoaded", () => {
    setupTeamFixtureFilter();
    setupMatchDetailsPanels();
  });

  function setupTeamFixtureFilter() {
    const toolbar = document.querySelector(".toolbar");
    const fixtureList = document.querySelector("#fixture-list");

    if (!toolbar || !fixtureList || document.querySelector("#team-fixture-filter")) return;

    const control = document.createElement("label");
    control.className = "team-filter-control";
    control.setAttribute("for", "team-fixture-filter");
    control.innerHTML = `
      <span>Team search</span>
      <input id="team-fixture-filter" class="team-filter-input" list="team-fixture-options" type="search" placeholder="Search team fixtures" autocomplete="off" />
      <datalist id="team-fixture-options"></datalist>
    `;

    toolbar.append(control);

    const input = control.querySelector("#team-fixture-filter");
    const datalist = control.querySelector("#team-fixture-options");

    input.addEventListener("input", () => {
      teamFilterState.selected = normalise(input.value);
      applyTeamFixtureFilter();
    });

    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        window.requestAnimationFrame(() => {
          collectTeamOptions(datalist);
          syncTeamFilterVisibility(control, input);
          applyTeamFixtureFilter();
        });
      });
    });

    const observer = new MutationObserver(() => {
      collectTeamOptions(datalist);
      syncTeamFilterVisibility(control, input);
      applyTeamFixtureFilter();
    });

    observer.observe(fixtureList, { childList: true });
    collectTeamOptions(datalist);
    syncTeamFilterVisibility(control, input);
  }

  function setupMatchDetailsPanels() {
    const fixtureList = document.querySelector("#fixture-list");
    if (!fixtureList) return;

    fixtureList.addEventListener("click", (event) => {
      const card = event.target.closest(".fixture-card");
      if (!card || card.hidden) return;
      toggleMatchDetails(card);
    });

    fixtureList.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const card = event.target.closest(".fixture-card");
      if (!card || card.hidden) return;

      event.preventDefault();
      toggleMatchDetails(card);
    });
  }

  function collectTeamOptions(datalist) {
    document.querySelectorAll(".fixture-card").forEach((card) => {
      [card.dataset.homeTeam, card.dataset.awayTeam]
        .map(clean)
        .filter(isSelectableTeam)
        .forEach((team) => teamFilterState.teams.add(team));
    });

    datalist.innerHTML = [...teamFilterState.teams]
      .sort((a, b) => a.localeCompare(b))
      .map((team) => `<option value="${escapeHtml(team)}"></option>`)
      .join("");
  }

  function syncTeamFilterVisibility(control, input) {
    const isScotlandFilter = activeFixtureFilter() === "scotland";
    control.hidden = isScotlandFilter;

    if (isScotlandFilter) {
      input.value = "";
      teamFilterState.selected = "";
      document.querySelector(".team-filter-empty")?.remove();
    }
  }

  function activeFixtureFilter() {
    return document.querySelector(".filter-button.is-active")?.dataset.filter || "all";
  }

  function applyTeamFixtureFilter() {
    const selected = teamFilterState.selected;
    const cards = [...document.querySelectorAll(".fixture-card")];
    const fixtureList = document.querySelector("#fixture-list");
    let visibleCount = 0;

    document.querySelector(".team-filter-empty")?.remove();

    cards.forEach((card) => {
      const teams = [card.dataset.homeTeam, card.dataset.awayTeam].map(normalise);
      const visible = !selected || teams.some((team) => team.includes(selected));
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (selected && fixtureList && cards.length && visibleCount === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state team-filter-empty";
      empty.textContent = "No fixtures match that team search.";
      fixtureList.append(empty);
    }
  }

  async function toggleMatchDetails(card) {
    const eventId = clean(card.dataset.eventId);
    if (!eventId) return;

    const panelId = `match-details-${slugify(eventId)}`;
    const existing = document.getElementById(panelId);
    const isOpen = card.getAttribute("aria-expanded") === "true";

    document.querySelectorAll(".fixture-card[aria-expanded='true']").forEach((openCard) => {
      if (openCard !== card) openCard.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".match-details-panel").forEach((panel) => {
      if (panel.id !== panelId) panel.remove();
    });

    if (existing || isOpen) {
      existing?.remove();
      card.setAttribute("aria-expanded", "false");
      return;
    }

    card.setAttribute("aria-expanded", "true");
    card.insertAdjacentHTML("afterend", renderMatchDetailsShell(card, panelId));

    const panel = document.getElementById(panelId);
    if (!panel) return;

    try {
      const details = await loadMatchDetails(eventId);
      panel.innerHTML = renderMatchDetails(card, details);
    } catch (error) {
      console.warn("Match details unavailable", error);
      panel.innerHTML = renderMatchDetailsUnavailable(card);
    }
  }

  function renderMatchDetailsShell(card, panelId) {
    return `
      <section class="match-details-panel" id="${panelId}" aria-label="Match details for ${escapeHtml(card.dataset.homeTeam)} v ${escapeHtml(card.dataset.awayTeam)}">
        <div class="match-details-loading">Loading match details…</div>
      </section>`;
  }

  async function loadMatchDetails(eventId) {
    if (matchDetailsCache.has(eventId)) {
      return matchDetailsCache.get(eventId);
    }

    const endpoints = [
      ["event", "lookupevent.php"],
      ["results", "eventresults.php"],
      ["lineup", "lookuplineup.php"],
      ["timeline", "lookuptimeline.php"],
      ["stats", "lookupeventstats.php"]
    ];

    const settled = await Promise.allSettled(
      endpoints.map(([key, endpoint]) => request(endpoint, { id: eventId }).then((payload) => [key, payload]))
    );

    const details = {
      event: null,
      results: [],
      lineup: [],
      timeline: [],
      stats: []
    };

    settled.forEach((result) => {
      if (result.status !== "fulfilled") return;

      const [key, payload] = result.value;
      const rows = extractDetailRows(payload, key);

      if (key === "event") {
        details.event = rows[0] || null;
      } else {
        details[key] = rows;
      }
    });

    matchDetailsCache.set(eventId, details);
    return details;
  }

  function extractDetailRows(payload, key) {
    if (!payload) return [];

    const candidates = [
      payload[key],
      payload.event,
      payload.events,
      payload.results,
      payload.result,
      payload.lineup,
      payload.timeline,
      payload.timelines,
      payload.eventstats,
      payload.stats
    ];

    return candidates.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
  }

  function renderMatchDetails(card, details) {
    const home = clean(card.dataset.homeTeam);
    const away = clean(card.dataset.awayTeam);
    const event = details.event || {};
    const venue = clean(event.strVenue || event.strCity ? [event.strVenue, event.strCity].filter(Boolean).join(", ") : card.dataset.venue) || "Venue TBC";
    const score = clean(card.dataset.score) || "Not started";
    const status = clean(card.dataset.status) || "NS";
    const kickoff = clean(card.dataset.kickoff) ? new Date(card.dataset.kickoff) : null;
    const hasExtraData = details.lineup.length || details.timeline.length || details.stats.length;

    return `
      <div class="match-details-inner">
        <div class="match-details-header">
          <div>
            <span class="match-details-kicker">Match details</span>
            <h3>${escapeHtml(home)} <span>v</span> ${escapeHtml(away)}</h3>
          </div>
          <span class="fixture-status ${statusClass(status)}">${escapeHtml(status)}</span>
        </div>

        <dl class="match-details-summary">
          <div><dt>Score</dt><dd>${escapeHtml(score)}</dd></div>
          <div><dt>Kick-off</dt><dd>${escapeHtml(shortDate(kickoff))} · ${escapeHtml(kickoffTime(kickoff))}</dd></div>
          <div><dt>Venue</dt><dd>${escapeHtml(venue)}</dd></div>
          <div><dt>Stage</dt><dd>${escapeHtml(card.dataset.stage || "Fixture")}</dd></div>
        </dl>

        ${renderStats(details.stats, home, away)}
        ${renderTimeline(details.timeline)}
        ${renderLineups(details.lineup, home, away)}
        ${hasExtraData ? "" : `<p class="match-details-note">Lineups, timeline and match stats are not available yet for this fixture.</p>`}
      </div>`;
  }

  function renderMatchDetailsUnavailable(card) {
    return `
      <div class="match-details-inner">
        <div class="match-details-header">
          <div>
            <span class="match-details-kicker">Match details</span>
            <h3>${escapeHtml(card.dataset.homeTeam)} <span>v</span> ${escapeHtml(card.dataset.awayTeam)}</h3>
          </div>
        </div>
        <p class="match-details-note">Extra match details are not available right now. Please try again closer to kick-off or after full time.</p>
      </div>`;
  }

  function renderStats(stats, home, away) {
    const rows = stats
      .map((row) => ({
        name: clean(row.strStat || row.strStatistic || row.stat || row.name),
        home: clean(row.intHome || row.strHome || row.home || row.homeStat),
        away: clean(row.intAway || row.strAway || row.away || row.awayStat)
      }))
      .filter((row) => row.name && (row.home || row.away));

    if (!rows.length) return `<section class="match-detail-block"><h4>Match stats</h4><p class="match-details-note">Match stats are not available yet.</p></section>`;

    return `
      <section class="match-detail-block">
        <h4>Match stats</h4>
        <div class="match-stats-table" role="table" aria-label="Match stats">
          <div class="match-stats-row match-stats-head" role="row">
            <span role="columnheader">${escapeHtml(home)}</span>
            <span role="columnheader">Stat</span>
            <span role="columnheader">${escapeHtml(away)}</span>
          </div>
          ${rows.map((row) => `
            <div class="match-stats-row" role="row">
              <span role="cell">${escapeHtml(row.home || "—")}</span>
              <strong role="cell">${escapeHtml(row.name)}</strong>
              <span role="cell">${escapeHtml(row.away || "—")}</span>
            </div>`).join("")}
        </div>
      </section>`;
  }

  function renderTimeline(timeline) {
    const items = timeline
      .map((row) => ({
        time: clean(row.intTime || row.strTime || row.minute),
        event: clean(row.strTimeline || row.strEvent || row.strType || row.type),
        player: clean(row.strPlayer || row.player || row.strPlayerName),
        team: clean(row.strTeam || row.team)
      }))
      .filter((item) => item.event || item.player || item.team);

    if (!items.length) return `<section class="match-detail-block"><h4>Timeline</h4><p class="match-details-note">Timeline events are not available yet.</p></section>`;

    return `
      <section class="match-detail-block">
        <h4>Timeline</h4>
        <ol class="match-timeline">
          ${items.map((item) => `
            <li>
              <span>${escapeHtml(item.time ? `${item.time}'` : "—")}</span>
              <div>
                <strong>${escapeHtml(item.event || "Event")}</strong>
                <p>${escapeHtml([item.player, item.team].filter(Boolean).join(" · ") || "Details unavailable")}</p>
              </div>
            </li>`).join("")}
        </ol>
      </section>`;
  }

  function renderLineups(lineup, home, away) {
    const players = lineup
      .map((row) => ({
        team: clean(row.strTeam || row.team),
        player: clean(row.strPlayer || row.strPlayerName || row.player),
        position: clean(row.strPosition || row.position || row.strFormation)
      }))
      .filter((row) => row.player);

    if (!players.length) return `<section class="match-detail-block"><h4>Lineups</h4><p class="match-details-note">Lineups are not available yet.</p></section>`;

    const homePlayers = players.filter((row) => normalise(row.team) === normalise(home));
    const awayPlayers = players.filter((row) => normalise(row.team) === normalise(away));
    const fallbackGroups = groupByTeam(players);

    if (homePlayers.length || awayPlayers.length) {
      return `
        <section class="match-detail-block">
          <h4>Lineups</h4>
          <div class="lineup-grid">
            ${renderLineupTeam(home, homePlayers)}
            ${renderLineupTeam(away, awayPlayers)}
          </div>
        </section>`;
    }

    return `
      <section class="match-detail-block">
        <h4>Lineups</h4>
        <div class="lineup-grid">
          ${[...fallbackGroups.entries()].map(([team, rows]) => renderLineupTeam(team, rows)).join("")}
        </div>
      </section>`;
  }

  function renderLineupTeam(team, players) {
    return `
      <div class="lineup-team">
        <h5>${escapeHtml(team)}</h5>
        ${players.length ? `
          <ul>
            ${players.map((player) => `<li><span>${escapeHtml(player.player)}</span><small>${escapeHtml(player.position || "Squad")}</small></li>`).join("")}
          </ul>` : `<p class="match-details-note">Not available yet.</p>`}
      </div>`;
  }

  function groupByTeam(players) {
    return players.reduce((map, player) => {
      const team = player.team || "Team";
      if (!map.has(team)) map.set(team, []);
      map.get(team).push(player);
      return map;
    }, new Map());
  }

  function isSelectableTeam(team) {
    return team && !/\b(winner|runner|third|match|tbc|fixture|opponent|group\s+[a-l])\b/i.test(team);
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

    return /^(1h|1st half|first half|first-half|1st)$/i.test(status) ||
      /\b(1h|1st half|first half|first-half)\b/.test(status);
  }

  function isHalfTimeStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(ht|half time|half-time|halftime)$/i.test(status) ||
      /\bhalf.?time\b/.test(status);
  }

  function isSecondHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(2h|2nd half|second half|second-half|2nd)$/i.test(status) ||
      /\b(2h|2nd half|second half|second-half)\b/.test(status);
  }

  function isExtraFirstHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(et1h|et 1h|extra time 1h|extra time first half|first half extra time|1st half extra time)$/i.test(status) ||
      /\b(et1h|et 1h|extra time first half|first half extra time|1st half extra time)\b/.test(status);
  }

  function isExtraSecondHalfStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(et2h|et 2h|extra time 2h|extra time second half|second half extra time|2nd half extra time)$/i.test(status) ||
      /\b(et2h|et 2h|extra time second half|second half extra time|2nd half extra time)\b/.test(status);
  }

  function isPenaltyStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(pen|pens|penalties|penalty|penalty shootout|shootout)$/i.test(status) ||
      /\bpenalt|shootout/.test(status);
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

  function slugify(value) {
    return String(value || "match").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "match";
  }
})();