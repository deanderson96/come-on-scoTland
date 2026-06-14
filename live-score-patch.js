(() => {
  "use strict";

  const originalScore = typeof score === "function" ? score : null;

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
    const match = text.match(/(\d+)\s*[-:–—]\s*(\d+)/);
    if (!match) return null;

    return {
      home: Number(match[1]),
      away: Number(match[2])
    };
  }

  window.score = score = function apiAwareScore(event) {
    const stringScore = splitScoreString(
      event?.strScore ||
      event?.strResult ||
      event?.strProgress ||
      event?.strStatus ||
      event?.strLive ||
      event?.score
    );

    if (stringScore) {
      return `${stringScore.home}-${stringScore.away}`;
    }

    const home = firstScoreValue(event, [
      "intHomeScore",
      "intHomeGoals",
      "intHomeGoalScore",
      "intHomeTeamScore",
      "homeScore",
      "home_score",
      "homeGoals",
      "home_goals",
      "scoreHome",
      "score_home"
    ]);

    const away = firstScoreValue(event, [
      "intAwayScore",
      "intAwayGoals",
      "intAwayGoalScore",
      "intAwayTeamScore",
      "awayScore",
      "away_score",
      "awayGoals",
      "away_goals",
      "scoreAway",
      "score_away"
    ]);

    if (Number.isFinite(home) && Number.isFinite(away)) {
      return `${home}-${away}`;
    }

    return originalScore ? originalScore(event) : "";
  };
})();
