(() => {
  "use strict";

  if (!document.querySelector("#dark-mode-contrast-patch")) {
    const style = document.createElement("style");
    style.id = "dark-mode-contrast-patch";
    style.textContent = `
      html[data-theme="dark"] {
        --dark-text: #f5fbff;
        --dark-text-soft: rgba(237, 247, 255, 0.78);
        --dark-text-muted: rgba(237, 247, 255, 0.64);
        --dark-panel: rgba(8, 21, 45, 0.9);
        --dark-panel-strong: rgba(10, 27, 58, 0.96);
      }

      html[data-theme="dark"] body,
      html[data-theme="dark"] main,
      html[data-theme="dark"] .section,
      html[data-theme="dark"] .quick-info,
      html[data-theme="dark"] .today-fixtures-section {
        color: var(--dark-text) !important;
      }

      html[data-theme="dark"] .section-heading h2,
      html[data-theme="dark"] .hero h1,
      html[data-theme="dark"] .stat-card strong,
      html[data-theme="dark"] .scoreboard strong,
      html[data-theme="dark"] .fixture-row-team.is-leading,
      html[data-theme="dark"] .fixture-row-team strong,
      html[data-theme="dark"] .group-card strong,
      html[data-theme="dark"] .knockout-card strong,
      html[data-theme="dark"] .site-footer strong {
        color: var(--dark-text) !important;
      }

      html[data-theme="dark"] .section-heading p,
      html[data-theme="dark"] .stat-card p,
      html[data-theme="dark"] .scoreboard span,
      html[data-theme="dark"] .fixture-row-time,
      html[data-theme="dark"] .fixture-row-stage,
      html[data-theme="dark"] .fixture-row-team,
      html[data-theme="dark"] .group-card th,
      html[data-theme="dark"] .group-card td,
      html[data-theme="dark"] .knockout-card p,
      html[data-theme="dark"] .site-footer,
      html[data-theme="dark"] .empty-state {
        color: var(--dark-text-soft) !important;
      }

      html[data-theme="dark"] .eyebrow,
      html[data-theme="dark"] .group-label,
      html[data-theme="dark"] .fixture-day-heading,
      html[data-theme="dark"] .fixture-day-heading small,
      html[data-theme="dark"] .team-name,
      html[data-theme="dark"] .brand small,
      html[data-theme="dark"] .nav-menu a {
        color: var(--dark-text) !important;
      }

      html[data-theme="dark"] .stat-card,
      html[data-theme="dark"] .fixture-day-heading,
      html[data-theme="dark"] .fixture-day-card,
      html[data-theme="dark"] .fixture-card,
      html[data-theme="dark"] .fixture-card.is-compact,
      html[data-theme="dark"] .group-card,
      html[data-theme="dark"] .knockout-card,
      html[data-theme="dark"] .empty-state {
        border-color: rgba(185, 232, 255, 0.18) !important;
        background:
          linear-gradient(135deg, rgba(141, 216, 255, 0.1), transparent 42%),
          var(--dark-panel) !important;
      }

      html[data-theme="dark"] .fixture-row-time span,
      html[data-theme="dark"] .filter-button,
      html[data-theme="dark"] .button-secondary {
        color: var(--dark-text) !important;
        background: rgba(141, 216, 255, 0.12) !important;
        border-color: rgba(185, 232, 255, 0.18) !important;
      }

      html[data-theme="dark"] .filter-button.is-active,
      html[data-theme="dark"] .button-primary {
        color: #031025 !important;
        background: var(--sky-300) !important;
      }

      html[data-theme="dark"] .fixture-status.status-ns,
      html[data-theme="dark"] .fixture-status.status-ht {
        color: #031025 !important;
      }

      html[data-theme="dark"] .fixture-status.status-ft,
      html[data-theme="dark"] .fixture-status.status-result,
      html[data-theme="dark"] .fixture-status.status-1h,
      html[data-theme="dark"] .fixture-status.status-2h,
      html[data-theme="dark"] .fixture-status.status-et1h,
      html[data-theme="dark"] .fixture-status.status-et2h,
      html[data-theme="dark"] .fixture-status.status-pen {
        color: #ffffff !important;
      }

      html[data-theme="dark"] .group-card tbody tr.is-playing td,
      html[data-theme="dark"] .group-card tbody tr.is-playing .team-name {
        color: #ffffff !important;
      }

      html[data-theme="dark"] .standings-live-marker,
      html[data-theme="dark"] .fixture-live-indicator {
        color: #ffe7e3 !important;
        background: rgba(180, 35, 24, 0.28) !important;
        box-shadow: inset 0 0 0 1px rgba(255, 180, 171, 0.22) !important;
      }
    `;

    document.head.append(style);
  }

  installScoredFixtureMerge();

  function installScoredFixtureMerge() {
    const activeCacheKey = "scotland-2026-world-cup-cache-v41";
    const cachePrefix = "scotland-2026-world-cup-cache-v";

    if (typeof CONFIG === "object") {
      CONFIG.cacheKey = activeCacheKey;
    }

    if (typeof loadData === "function") {
      loadData = loadDataWithScoredMerge;
      window.loadData = loadDataWithScoredMerge;
    }

    if (typeof readCache === "function") {
      readCache = readBestApiCache;
      window.readCache = readBestApiCache;
    }

    if (typeof writeCache === "function") {
      writeCache = writeApiCache;
      window.writeCache = writeApiCache;
    }

    async function loadDataWithScoredMerge() {
      CONFIG.cacheKey = activeCacheKey;
      const cached = readBestApiCache();

      if (cached && typeof cacheExpired === "function" && !cacheExpired(cached.fetchedAt) && hasEnoughApiData(cached)) {
        applyData(cached);
        return;
      }

      try {
        const fresh = await fetchTournamentData();
        const merged = mergeApiData(fresh, cached);
        writeApiCache(merged);
        applyData(merged);
      } catch (error) {
        console.warn("Fresh tournament data unavailable", error);

        if (cached) {
          applyData(cached);
        } else if (typeof renderUnavailable === "function") {
          renderUnavailable();
        }
      }
    }

    function readBestApiCache() {
      try {
        return cacheKeys()
          .map((key) => parseCachedValue(localStorage.getItem(key)))
          .filter(Boolean)
          .sort((a, b) => cacheScore(b) - cacheScore(a))[0] || null;
      } catch {
        return null;
      }
    }

    function writeApiCache(data) {
      try {
        localStorage.setItem(activeCacheKey, JSON.stringify(data));
      } catch {
        // localStorage may be unavailable in restricted browsing modes.
      }
    }

    function mergeApiData(fresh, cached) {
      if (!cached) return fresh;

      return {
        fetchedAt: fresh.fetchedAt || new Date().toISOString(),
        rawEvents: mergeEventsByRichness([
          ...safeArray(cached.rawEvents),
          ...safeArray(fresh.rawEvents)
        ]),
        rawTable: typeof uniqueTableRows === "function"
          ? uniqueTableRows([...safeArray(cached.rawTable), ...safeArray(fresh.rawTable)])
          : [...safeArray(cached.rawTable), ...safeArray(fresh.rawTable)]
      };
    }

    function mergeEventsByRichness(events) {
      const map = new Map();

      events.forEach((event) => {
        const key = eventKey(event);
        if (!key) return;

        const current = map.get(key);
        if (!current) {
          map.set(key, event);
          return;
        }

        map.set(key, richerEvent(current, event));
      });

      return [...map.values()].sort((a, b) => {
        const aDate = typeof kickoffDate === "function" ? kickoffDate(a) : null;
        const bDate = typeof kickoffDate === "function" ? kickoffDate(b) : null;
        return (aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER) - (bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER);
      });
    }

    function richerEvent(a, b) {
      const aScore = eventRichness(a);
      const bScore = eventRichness(b);
      const winner = bScore >= aScore ? b : a;
      const loser = winner === b ? a : b;
      return mergeNonEmpty(loser, winner);
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

    function eventRichness(event) {
      const scoreText = typeof score === "function" ? score(event) : "";
      const statusText = cleanText([
        event?.strStatus,
        event?.strProgress,
        event?.strLive,
        event?.status,
        event?.strResult,
        event?.strScore,
        event?.score
      ].filter(Boolean).join(" ")).toLowerCase();
      const hasScore = /\d+\s*[-:–—]\s*\d+/.test(scoreText) || /\d+\s*[-:–—]\s*\d+/.test(statusText);
      const liveOrResult = /live|in progress|1h|2h|half|ft|full.?time|finished|result|ended/.test(statusText);
      const filledFields = Object.values(event || {}).filter((value) => value !== null && value !== undefined && value !== "").length;

      return (hasScore ? 1000 : 0) + (liveOrResult ? 250 : 0) + filledFields;
    }

    function cacheKeys() {
      const keys = [activeCacheKey];

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(cachePrefix) && !keys.includes(key)) {
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

    function cacheScore(data) {
      return safeArray(data.rawEvents).length + safeArray(data.rawTable).length * 2 + scoredEventCount(data.rawEvents) * 4;
    }

    function scoredEventCount(events) {
      return safeArray(events).filter((event) => eventRichness(event) >= 1000).length;
    }

    function hasEnoughApiData(data) {
      return safeArray(data.rawEvents).length >= 24 || safeArray(data.rawTable).length >= 24;
    }

    function safeArray(value) {
      return Array.isArray(value) ? value : [];
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

    function cleanText(value) {
      return String(value ?? "").replace(/\s+/g, " ").trim();
    }
  }
})();
