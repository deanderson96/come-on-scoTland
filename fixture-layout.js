(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v31";
  }

  const GROUP_TEAMS = {
    A: ["Mexico", "South Africa", "South Korea", "Czechia"],
    B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    C: ["Brazil", "Morocco", "Haiti", "Scotland"],
    D: ["United States", "Paraguay", "Australia", "Turkey"],
    E: ["Germany", "Curacao", "Curaçao", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    I: ["France", "Senegal", "Iraq", "Norway"],
    J: ["Argentina", "Algeria", "Austria", "Jordan"],
    K: ["Portugal", "DR Congo", "Democratic Republic of the Congo", "Uzbekistan", "Colombia"],
    L: ["England", "Croatia", "Ghana", "Panama"]
  };

  const TEAM_TO_GROUP = Object.entries(GROUP_TEAMS).reduce((lookup, [group, teams]) => {
    teams.forEach((team) => {
      lookup.set(normaliseTeamName(team), `Group ${group}`);
    });
    return lookup;
  }, new Map());

  const originalApplyData = window.applyData;

  window.renderFixtureCard = renderCompactFixtureCard;

  if (typeof renderFixtures === "function") {
    renderFixtures = renderGroupedFixtures;
    window.renderFixtures = renderGroupedFixtures;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const todayText = document.querySelector("#today .section-heading p:last-child");
    if (todayText) {
      todayText.textContent = "Matches scheduled for today in Europe/London time.";
    }
  });

  function renderGroupedFixtures(filter = "all") {
    if (!els.fixtureList) return;

    const fixtures = state.fixtures.filter((match) => {
      if (filter === "scotland") return isScotland(match);
      if (filter === "group") return match.phase === "group";
      if (filter === "knockout") return match.phase === "knockout";
      return true;
    });

    if (!fixtures.length) {
      els.fixtureList.innerHTML = `<div class="empty-state">No fixtures are available for this filter yet.</div>`;
      return;
    }

    els.fixtureList.innerHTML = renderFixtureGroups(fixtures);
  }

  function renderCompactFixtureCard(match) {
    const liveIndicator = match.isLive
      ? `<span class="fixture-live-indicator" aria-label="Live match"><span aria-hidden="true"></span>Live</span>`
      : "";
    const scoreParts = splitScore(match.score);
    const status = escapeHtml(match.status);
    const group = displayGroup(match.group || match.stage, match);

    return `
      <article class="fixture-card fixture-row is-compact ${isScotland(match) ? "is-scotland" : ""} ${match.isLive ? "is-live" : ""}" data-event-id="${escapeHtml(match.id)}" data-home-team="${escapeHtml(match.home)}" data-away-team="${escapeHtml(match.away)}" data-stage="${escapeHtml(group)}" data-venue="${escapeHtml(match.venue)}" data-kickoff="${match.kickoff ? match.kickoff.toISOString() : ""}" data-status="${status}" data-score="${escapeHtml(match.score || "")}">
        <div class="fixture-row-time">
          <span>${kickoffHour(match.kickoff)}</span>
        </div>

        <div class="fixture-row-main">
          <span class="fixture-row-stage">${escapeHtml(group)}</span>
          <div class="fixture-row-teams">
            <div class="fixture-row-team ${scoreParts.home > scoreParts.away ? "is-leading" : ""}">
              <span>${escapeHtml(match.home)}</span>
              <strong>${scoreParts.homeText}</strong>
            </div>
            <div class="fixture-row-team ${scoreParts.away > scoreParts.home ? "is-leading" : ""}">
              <span>${escapeHtml(match.away)}</span>
              <strong>${scoreParts.awayText}</strong>
            </div>
          </div>
        </div>

        <div class="fixture-status-stack">
          ${liveIndicator}
          <span class="fixture-status ${statusClass(match.status)}">${status}</span>
        </div>
      </article>`;
  }

  if (typeof originalApplyData === "function") {
    window.applyData = function applyDataWithTodaysFixtures(data) {
      originalApplyData(data);
      renderTodaysFixtures(data);
    };
  }

  function renderTodaysFixtures(data) {
    const list = document.querySelector("#today-fixture-list");
    if (!list) return;

    const fixtures = (data.rawEvents || [])
      .map(mapEvent)
      .filter(Boolean)
      .filter((match) => match.kickoff && dateKey(match.kickoff) === dateKey(new Date()))
      .sort(sortMatches);

    if (!fixtures.length) {
      list.innerHTML = `<div class="empty-state">No World Cup fixtures are scheduled for today.</div>`;
      return;
    }

    list.innerHTML = `
      <div class="fixture-day-card today-fixture-card">
        ${fixtures.map(window.renderFixtureCard).join("")}
      </div>`;
  }

  function renderFixtureGroups(fixtures, options = {}) {
    return [...groupFixturesByDay(fixtures).entries()]
      .map(([key, matches]) => {
        const label = dayLabel(matches[0]?.kickoff, options.compactHeading);
        const open = options.openAll || key === dateKey(new Date()) ? " open" : "";
        const count = matches.length;

        return `
          <details class="fixture-day-group" data-day="${escapeHtml(key)}"${open}>
            <summary class="fixture-day-heading">
              <span>${escapeHtml(label)}</span>
              <small>${count} fixture${count === 1 ? "" : "s"}</small>
            </summary>
            <div class="fixture-day-card">
              ${matches.map(window.renderFixtureCard).join("")}
            </div>
          </details>`;
      })
      .join("");
  }

  function groupFixturesByDay(fixtures) {
    return fixtures.reduce((groups, match) => {
      const key = match.kickoff ? dateKey(match.kickoff) : "tbc";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(match);
      return groups;
    }, new Map());
  }

  function splitScore(value) {
    const score = clean(value);
    const match = score.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!match) {
      return {
        home: Number.NaN,
        away: Number.NaN,
        homeText: "",
        awayText: ""
      };
    }

    return {
      home: Number(match[1]),
      away: Number(match[2]),
      homeText: match[1],
      awayText: match[2]
    };
  }

  function displayGroup(value, match = {}) {
    const inferredGroup = inferGroupFromTeams(match.home, match.away);
    const groupValue = clean(match.group);
    const stage = clean(value) || groupValue || clean(match.stage);
    const groupMatch = stage.match(/Group\s+([A-L])/i);

    if (groupMatch) {
      return `Group ${groupMatch[1].toUpperCase()}`;
    }

    if (inferredGroup && /group\s*stage|fifa\s+world\s+cup|world\s+cup|fixture/i.test(stage)) {
      return inferredGroup;
    }

    const cleanedStage = stage
      .replace(/FIFA\s+World\s+Cup\s*[,\-–—:]?\s*/i, "")
      .replace(/^World\s+Cup\s*[,\-–—:]?\s*/i, "")
      .trim();

    if (groupValue) return groupValue;
    if (cleanedStage && !/^group\s*stage$/i.test(cleanedStage)) return cleanedStage;
    return inferredGroup || (match.phase === "knockout" ? "Knockout" : "Group stage");
  }

  function inferGroupFromTeams(home, away) {
    const homeGroup = TEAM_TO_GROUP.get(normaliseTeamName(home));
    const awayGroup = TEAM_TO_GROUP.get(normaliseTeamName(away));

    if (homeGroup && homeGroup === awayGroup) return homeGroup;
    return homeGroup || awayGroup || "";
  }

  function normaliseTeamName(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/\bthe\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function kickoffHour(date) {
    if (!date) return "TBC";

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: CONFIG.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function dayLabel(date, compact = false) {
    if (!date) return "Date TBC";

    const today = dateKey(new Date());
    const tomorrow = dateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const key = dateKey(date);
    const dateText = new Intl.DateTimeFormat("en-GB", {
      timeZone: CONFIG.timeZone,
      day: "numeric",
      month: "short"
    }).format(date);

    if (key === today) return `Today • ${dateText}`;
    if (key === tomorrow) return `Tomorrow • ${dateText}`;
    if (compact) return dateText;

    const weekday = new Intl.DateTimeFormat("en-GB", {
      timeZone: CONFIG.timeZone,
      weekday: "long"
    }).format(date);

    return `${weekday} • ${dateText}`;
  }

  function dateKey(date) {
    if (!date) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: CONFIG.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
})();