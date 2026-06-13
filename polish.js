(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v15";
  }

  const teamFilterState = {
    teams: new Set(),
    selected: ""
  };

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

    return `
      <article class="fixture-card ${isScotland(match) ? "is-scotland" : ""} ${match.isLive ? "is-live" : ""}" data-home-team="${escapeHtml(match.home)}" data-away-team="${escapeHtml(match.away)}">
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

  document.addEventListener("DOMContentLoaded", setupTeamFixtureFilter);

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
          applyTeamFixtureFilter();
        });
      });
    });

    const observer = new MutationObserver(() => {
      collectTeamOptions(datalist);
      applyTeamFixtureFilter();
    });

    observer.observe(fixtureList, { childList: true });
    collectTeamOptions(datalist);
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
})();