(() => {
  "use strict";

  const ACTIVE_CACHE_KEY = "scotland-2026-world-cup-cache-v41";
  const CACHE_PREFIX = "scotland-2026-world-cup-cache-v";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = ACTIVE_CACHE_KEY;
  }

  if (typeof loadData === "function") {
    loadData = loadDataWithRichFixtureMerge;
    window.loadData = loadDataWithRichFixtureMerge;
  }

  if (typeof readCache === "function") {
    readCache = readBestApiCache;
    window.readCache = readBestApiCache;
  }

  if (typeof writeCache === "function") {
    writeCache = writeApiCache;
    window.writeCache = writeApiCache;
  }

  async function loadDataWithRichFixtureMerge() {
    CONFIG.cacheKey = ACTIVE_CACHE_KEY;
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
      localStorage.setItem(ACTIVE_CACHE_KEY, JSON.stringify(data));
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
    const keys = [ACTIVE_CACHE_KEY];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX) && !keys.includes(key)) {
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
})();
