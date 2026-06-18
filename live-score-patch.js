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
