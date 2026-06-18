(() => {
  "use strict";

  const originalMapEvent = typeof window.mapEvent === "function" ? window.mapEvent : null;

  window.matchStatus = function matchStatusFinishedScoreFirst(event, matchScore) {
    const apiStatus = rawStatusText(event);
    const scoreline = matchScore || (typeof score === "function" ? score(event) : "");

    if (isFinishedText(apiStatus)) return "FT";
    if (isExplicitLiveText(apiStatus)) return liveStatusCode(apiStatus);
    if (scoreline) return "FT";
    if (appearsInPlayNow(event)) return "1H";

    return "NS";
  };

  window.mapEvent = function mapEventWithFixedStatus(event) {
    const mapped = originalMapEvent ? originalMapEvent(event) : fallbackMapEvent(event);
    const fixedScore = typeof score === "function" ? score(event) : mapped.score;
    const fixedStatus = window.matchStatus(event, fixedScore);

    return {
      ...mapped,
      score: fixedScore,
      status: fixedStatus,
      isLive: /^(1H|HT|2H|ET1H|ET2H|PEN)$/i.test(fixedStatus)
    };
  };

  function fallbackMapEvent(event) {
    const home = cleanText(event?.strHomeTeam || event?.strEvent || "Fixture TBC");
    const away = cleanText(event?.strAwayTeam || "Opponent TBC");
    const group = typeof groupName === "function" ? groupName([
      event?.strGroup,
      event?.strRound,
      event?.strStage,
      event?.strEvent,
      event?.strEventAlternate,
      event?.strDescriptionEN,
      event?.strDescription
    ].join(" ")) : "";
    const stage = group || (typeof stageName === "function" ? stageName(event) : "Group stage");
    const phase = typeof isKnockoutStage === "function" && isKnockoutStage(stage) ? "knockout" : "group";
    const kickoff = typeof kickoffDate === "function" ? kickoffDate(event) : null;
    const matchScore = typeof score === "function" ? score(event) : "";
    const status = window.matchStatus(event, matchScore);

    return {
      id: cleanText(event?.idEvent) || `${home}-${away}-${event?.dateEvent || ""}-${event?.strTime || ""}`,
      phase,
      stage,
      group,
      home,
      away,
      venue: cleanText([event?.strVenue, event?.strCity].filter(Boolean).join(", ")) || "Venue TBC",
      kickoff,
      score: matchScore,
      status,
      isLive: /^(1H|HT|2H|ET1H|ET2H|PEN)$/i.test(status)
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

  function isFinishedText(value) {
    const text = cleanText(value).toLowerCase();
    return /^(ft|full time|full-time|finished|match finished|ended|after extra time|aet|after penalties|ap|complete|completed)$/i.test(text) ||
      /full.?time|finished|match ended|after extra time|after penalties|result|complete/i.test(text);
  }

  function isExplicitLiveText(value) {
    const text = cleanText(value).toLowerCase();
    return /^(live|in play|in-play|playing|1h|2h|ht|et|et1h|et2h|pen|pens|penalties)$/i.test(text) ||
      /\blive\b|in progress|in-play|in play|first half|second half|half.?time|extra time|penalt|shootout/i.test(text);
  }

  function liveStatusCode(value) {
    const text = cleanText(value).toLowerCase();
    if (/pen|shootout/.test(text)) return "PEN";
    if (/et2h|extra time second|second half extra/.test(text)) return "ET2H";
    if (/et1h|extra time first|first half extra/.test(text)) return "ET1H";
    if (/half.?time|\bht\b/.test(text)) return "HT";
    if (/2h|2nd half|second half/.test(text)) return "2H";
    return "1H";
  }

  function appearsInPlayNow(event) {
    if (typeof kickoffDate !== "function") return false;

    const kickoff = kickoffDate(event);
    if (!kickoff) return false;

    const now = Date.now();
    const startWindow = kickoff.getTime();
    const endWindow = kickoff.getTime() + 3.25 * 60 * 60 * 1000;
    return now >= startWindow && now <= endWindow;
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }
})();
