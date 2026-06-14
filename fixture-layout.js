(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v20";
  }

  const originalApplyData = window.applyData;

  window.renderFixtureCard = function renderCompactFixtureCard(match) {
    const liveIndicator = match.isLive
      ? `<span class="fixture-live-indicator" aria-label="Live match"><span aria-hidden="true"></span>Live</span>`
      : "";
    const panelId = `match-details-${localSlugify(match.id)}`;

    return `
      <article class="fixture-card is-compact ${isScotland(match) ? "is-scotland" : ""} ${match.isLive ? "is-live" : ""}" role="button" tabindex="0" aria-expanded="false" aria-controls="${panelId}" data-event-id="${escapeHtml(match.id)}" data-home-team="${escapeHtml(match.home)}" data-away-team="${escapeHtml(match.away)}" data-stage="${escapeHtml(match.stage)}" data-venue="${escapeHtml(match.venue)}" data-kickoff="${match.kickoff ? match.kickoff.toISOString() : ""}" data-status="${escapeHtml(match.status)}" data-score="${escapeHtml(match.score || "")}">
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
          <span class="fixture-expand-cue">Details</span>
        </div>

        <div class="fixture-status-stack">
          ${liveIndicator}
          <span class="fixture-status ${statusClass(match.status)}">${escapeHtml(match.status)}</span>
        </div>
      </article>`;
  };

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

    list.innerHTML = fixtures.map(window.renderFixtureCard).join("");
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
