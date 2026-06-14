(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v21";
  }

  const originalApplyData = window.applyData;

  window.renderFixtureCard = renderCompactFixtureCard;

  if (typeof renderFixtures === "function") {
    renderFixtures = renderGroupedFixtures;
    window.renderFixtures = renderGroupedFixtures;
  }

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
    const panelId = `match-details-${localSlugify(match.id)}`;
    const scoreParts = splitScore(match.score);
    const status = escapeHtml(match.status);

    return `
      <article class="fixture-card fixture-row is-compact ${isScotland(match) ? "is-scotland" : ""} ${match.isLive ? "is-live" : ""}" role="button" tabindex="0" aria-expanded="false" aria-controls="${panelId}" data-event-id="${escapeHtml(match.id)}" data-home-team="${escapeHtml(match.home)}" data-away-team="${escapeHtml(match.away)}" data-stage="${escapeHtml(match.stage)}" data-venue="${escapeHtml(match.venue)}" data-kickoff="${match.kickoff ? match.kickoff.toISOString() : ""}" data-status="${status}" data-score="${escapeHtml(match.score || "")}">
        <div class="fixture-row-time">
          <span>${kickoffHour(match.kickoff)}</span>
          <strong>${status}</strong>
        </div>

        <div class="fixture-row-main">
          <div class="fixture-row-meta">
            <span aria-hidden="true">🏆</span>
            <strong>Football</strong>
            <small>›</small>
            <span>FIFA World Cup${match.stage ? `, ${escapeHtml(match.stage)}` : ""}</span>
          </div>

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

  document.addEventListener("DOMContentLoaded", () => {
    setupTodaysFixtureInteractions();
  });

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

    list.innerHTML = renderFixtureGroups(fixtures, { compactHeading: true });
  }

  function renderFixtureGroups(fixtures, options = {}) {
    return [...groupFixturesByDay(fixtures).entries()]
      .map(([key, matches]) => `
        <section class="fixture-day-group" data-day="${escapeHtml(key)}">
          <h3 class="fixture-day-heading">${escapeHtml(dayLabel(matches[0]?.kickoff, options.compactHeading))}</h3>
          <div class="fixture-day-card">
            ${matches.map(window.renderFixtureCard).join("")}
          </div>
        </section>`)
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

  function setupTodaysFixtureInteractions() {
    const list = document.querySelector("#today-fixture-list");
    if (!list) return;

    list.addEventListener("click", (event) => {
      const card = event.target.closest(".fixture-card");
      if (!card || card.hidden) return;
      openFixtureInMainList(card);
    });

    list.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const card = event.target.closest(".fixture-card");
      if (!card || card.hidden) return;

      event.preventDefault();
      openFixtureInMainList(card);
    });
  }

  function openFixtureInMainList(card) {
    const id = clean(card.dataset.eventId);
    if (!id) return;

    const allButton = document.querySelector(".filter-button[data-filter='all']");
    if (allButton && !allButton.classList.contains("is-active")) {
      allButton.click();
    }

    window.requestAnimationFrame(() => {
      const target = [...document.querySelectorAll("#fixture-list .fixture-card")]
        .find((fixture) => clean(fixture.dataset.eventId) === id);

      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target.getAttribute("aria-expanded") !== "true") {
        target.click();
      }
    });
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

  function localSlugify(value) {
    return String(value || "match").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "match";
  }
})();
