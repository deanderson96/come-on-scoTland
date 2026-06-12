(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v8";
  }

  window.matchStatus = function matchStatus(event, matchScore) {
    const apiStatus = clean(event.strStatus || event.strProgress || event.strLive || event.status);
    const lowerStatus = apiStatus.toLowerCase();

    if (isAbandonedStatus(lowerStatus)) {
      return titleStatus(apiStatus || "Postponed");
    }

    if (isFinishedStatus(lowerStatus)) {
      return "Result";
    }

    if (isLiveStatus(lowerStatus)) {
      return "Live";
    }

    if (matchScore && appearsInPlay(event)) {
      return "Live";
    }

    if (matchScore) {
      return "Result";
    }

    return apiStatus ? titleStatus(apiStatus) : "Scheduled";
  };

  window.isLiveStatus = function isLiveStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    return /^(live|in play|in-play|playing|1h|2h|ht|et|pen|pens|penalties)$/i.test(status) ||
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

  function appearsInPlay(event) {
    if (typeof kickoffDate !== "function") return false;

    const kickoff = kickoffDate(event);
    if (!kickoff) return false;

    const now = Date.now();
    const startWindow = kickoff.getTime() - 15 * 60 * 1000;
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
