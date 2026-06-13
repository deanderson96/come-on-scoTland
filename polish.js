(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v10";
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
      status: matchStatus(event, matchScore),
      statusDetail: matchStatusDetail(event)
    };
  };

  window.renderFixtureCard = function renderFixtureCard(match) {
    const detail = match.statusDetail
      ? `<span class="fixture-status-detail status-detail-${statusClass(match.statusDetail).replace(/^status-/, "")}">${escapeHtml(match.statusDetail)}</span>`
      : "";

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

        <span class="fixture-status ${statusClass(match.status)}">
          <span>${escapeHtml(match.status)}</span>
          ${detail}
        </span>
      </article>`;
  };

  window.matchStatus = function matchStatus(event, matchScore) {
    const apiStatus = clean(event.strStatus || event.strProgress || event.strLive || event.status);
    const lowerStatus = apiStatus.toLowerCase();

    if (isAbandonedStatus(lowerStatus)) {
      return titleStatus(apiStatus || "Postponed");
    }

    if (isFinishedStatus(lowerStatus)) {
      return "Result";
    }

    if (isLiveStatus(lowerStatus) || matchStatusDetail(event) || appearsInPlay(event)) {
      return "Live";
    }

    if (matchScore) {
      return "Result";
    }

    return apiStatus ? titleStatus(apiStatus) : "Scheduled";
  };

  window.matchStatusDetail = function matchStatusDetail(event) {
    const apiStatus = clean(event.strStatus || event.strProgress || event.strLive || event.status).toLowerCase();

    if (isFinishedStatus(apiStatus) || isAbandonedStatus(apiStatus)) {
      return "";
    }

    if (isHalfTimeStatus(apiStatus)) {
      return "HT";
    }

    if (isPenaltyStatus(apiStatus)) {
      return "PEN";
    }

    if (isExtraTimeStatus(apiStatus)) {
      return "ET";
    }

    return "";
  };

  window.isLiveStatus = function isLiveStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(live|in play|in-play|playing|1h|2h|et|pen|pens|penalties|ht)$/i.test(status) ||
      /\blive\b|in progress|in-play|in play|first half|second half|half.?time|extra time|penalt/i.test(status);
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

  function isHalfTimeStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(ht|half time|half-time|halftime)$/i.test(status) ||
      /\bhalf.?time\b/.test(status);
  }

  function isExtraTimeStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(et|extra time|extra-time)$/i.test(status) ||
      /\bextra.?time\b/.test(status);
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

  function isAbandonedStatus(value) {
    return /postponed|cancelled|canceled|abandoned|suspended|delayed/i.test(String(value || ""));
  }

  function titleStatus(value) {
    return String(value || "")
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
})();