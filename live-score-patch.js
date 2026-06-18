(() => {
  "use strict";

  const originalScore = typeof score === "function" ? score : null;
  const originalUniqueEvents = typeof uniqueEvents === "function" ? uniqueEvents : null;

  function firstScoreValue(event, keys) {
    for (const key of keys) {
      const value = event?.[key];
      if (value === null || value === undefined || value === "") continue;

      const parsed = Number(String(value).trim());
      if (Number.isFinite(parsed)) return parsed;
    }

    return Number.NaN;
  }

  function splitScoreString(value) {
    const text = String(value || "").trim();
    const match = text.match(/(?:^|\D)(\d+)\s*[-:–—]\s*(\d+)(?:\D|$)/);
    if (!match) return null;

    return {
      home: Number(match[1]),
      away: Number(match[2])
    };
  }

  window.score = score = function apiAwareScore(event) {
    const stringScore = [
      event?.strScore,
      event?.strResult,
      event?.strProgress,
      event?.strStatus,
      event?.strLive,
      event?.strEvent,
      event?.strEventAlternate,
      event?.score,
      event?.result,
      event?.progress,
      event?.status
    ]
      .map(splitScoreString)
      .find(Boolean);

    if (stringScore) {
      return `${stringScore.home}-${stringScore.away}`;
    }

    const home = firstScoreValue(event, [
      "intHomeScore",
      "intHomeGoals",
      "intHomeGoalScore",
      "intHomeTeamScore",
      "intScoreHome",
      "intHome",
      "homeScore",
      "home_score",
      "homeGoals",
      "home_goals",
      "scoreHome",
      "score_home",
      "home_team_score",
      "homeTeamScore"
    ]);

    const away = firstScoreValue(event, [
      "intAwayScore",
      "intAwayGoals",
      "intAwayGoalScore",
      "intAwayTeamScore",
      "intScoreAway",
      "intAway",
      "awayScore",
      "away_score",
      "awayGoals",
      "away_goals",
      "scoreAway",
      "score_away",
      "away_team_score",
      "awayTeamScore"
    ]);

    if (Number.isFinite(home) && Number.isFinite(away)) {
      return `${home}-${away}`;
    }

    return originalScore ? originalScore(event) : "";
  };

  installMatchStatusGuard();

  if (originalUniqueEvents) {
    window.uniqueEvents = uniqueEvents = function uniqueEventsPreferScored(events) {
      const byKey = new Map();

      (Array.isArray(events) ? events : []).forEach((event) => {
        const key = eventKey(event);
        if (!key) return;

        const current = byKey.get(key);
        if (!current) {
          byKey.set(key, event);
          return;
        }

        byKey.set(key, richerEvent(current, event));
      });

      return [...byKey.values()];
    };
  }

  function installMatchStatusGuard() {
    let guardedStatus = guardMatchStatus(typeof window.matchStatus === "function" ? window.matchStatus : null);

    try {
      Object.defineProperty(window, "matchStatus", {
        configurable: true,
        get() {
          return guardedStatus;
        },
        set(nextStatus) {
          guardedStatus = guardMatchStatus(nextStatus);
        }
      });
    } catch {
      window.matchStatus = guardedStatus;
    }

    document.addEventListener("DOMContentLoaded", () => {
      window.matchStatus = guardMatchStatus(window.matchStatus);
    });
  }

  function guardMatchStatus(nextStatus) {
    const fallback = typeof nextStatus === "function" ? nextStatus : null;

    return function guardedMatchStatus(event, matchScore) {
      const apiStatus = rawStatusText(event);
      const scoreline = matchScore || score(event);

      if (isExplicitFinishedStatus(apiStatus)) return "FT";
      if (isExplicitLiveStatus(apiStatus)) return fallback ? fallback(event, matchScore) : "1H";
      if (scoreline) return "FT";

      return fallback ? fallback(event, matchScore) : "NS";
    };
  }

  function rawStatusText(event) {
    return [
      event?.strStatus,
      event?.strProgress,
      event?.strLive,
      event?.status,
      event?.strClock,
      event?.strTimeLine,
      event?.strPeriod
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isExplicitFinishedStatus(value) {
    return /^(ft|full time|full-time|finished|match finished|ended|after extra time|aet|after penalties|ap)$/i.test(cleanText(value)) ||
      /full.?time|finished|match ended|after extra time|after penalties|result/i.test(value);
  }

  function isExplicitLiveStatus(value) {
    return /^(live|in play|in-play|playing|1h|2h|ht|et|et1h|et2h|pen|pens|penalties)$/i.test(cleanText(value)) ||
      /\blive\b|in progress|in-play|in play|first half|second half|half.?time|extra time|penalt|shootout/i.test(value);
  }

  function richerEvent(a, b) {
    const aScore = eventRichness(a);
    const bScore = eventRichness(b);
    const winner = bScore >= aScore ? b : a;
    const loser = winner === b ? a : b;
    return mergeNonEmpty(loser, winner);
  }

  function eventRichness(event) {
    const scoreText = score(event);
    const statusText = [
      event?.strStatus,
      event?.strProgress,
      event?.strLive,
      event?.strResult,
      event?.strScore,
      event?.strEvent,
      event?.strEventAlternate,
      event?.status,
      event?.result,
      event?.score
    ].filter(Boolean).join(" ").toLowerCase();
    const hasScore = /^\d+\s*[-:–—]\s*\d+$/.test(scoreText);
    const isResult = /ft|full.?time|finished|result|ended|after extra time|after penalties|live|in progress|1h|2h|half/.test(statusText);
    const filledFields = Object.values(event || {}).filter((value) => value !== null && value !== undefined && value !== "").length;

    return (hasScore ? 1000 : 0) + (isResult ? 250 : 0) + filledFields;
  }

  function eventKey(event) {
    return cleanText(event?.idEvent) || [
      cleanText(event?.dateEvent),
      cleanText(event?.strTime),
      cleanText(event?.strHomeTeam),
      cleanText(event?.strAwayTeam),
      cleanText(event?.strEvent)
    ].join("|");
  }

  function mergeNonEmpty(base, override) {
    const merged = { ...base };

    Object.entries(override || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        merged[key] = value;
      }
    });

    return merged;
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }
})();
