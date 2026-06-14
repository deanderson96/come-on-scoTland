(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v39";
  }

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

    setupTournamentProgress();
    setupAnimatedFixtureDropdowns();
    updateTournamentProgress(state?.fixtures || []);
  });

  function renderGroupedFixtures(filter = "all") {
    if (!els.fixtureList) return;

    updateTournamentProgress(state.fixtures || []);

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
      updateTournamentProgress(state?.fixtures || []);
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

  function setupTournamentProgress() {
    if (document.querySelector("#fixtures-progress")) return;

    installTournamentProgressStyles();

    const toolbar = document.querySelector("#fixtures .toolbar");
    if (!toolbar) return;

    const progress = document.createElement("div");
    progress.id = "fixtures-progress";
    progress.className = "fixtures-progress";
    progress.innerHTML = `
      <div class="fixtures-progress__header">
        <span>Fixture completion</span>
        <strong data-progress-count>0 / 0 finished</strong>
      </div>
      <div class="fixtures-progress__bar" role="progressbar" aria-label="Tournament fixture completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="fixtures-progress__fill" style="width: 0%"></span>
        <strong class="fixtures-progress__percent">0%</strong>
      </div>`;

    toolbar.insertAdjacentElement("afterend", progress);
  }

  function installTournamentProgressStyles() {
    if (document.querySelector("#fixtures-progress-styles")) return;

    const style = document.createElement("style");
    style.id = "fixtures-progress-styles";
    style.textContent = `
      .fixtures-progress {
        width: min(var(--shell), calc(100% - 2rem));
        margin: -0.45rem auto 1.45rem;
        padding: 0.92rem;
        border: 1px solid rgba(7, 26, 61, 0.12);
        border-radius: 22px;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(251, 247, 234, 0.76)),
          rgba(255, 255, 255, 0.86);
        box-shadow: 0 18px 44px rgba(7, 26, 61, 0.09);
      }

      .fixtures-progress__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.62rem;
        color: rgba(7, 26, 61, 0.66);
        font-size: 0.72rem;
        font-weight: 950;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .fixtures-progress__header strong {
        color: var(--navy-900);
        letter-spacing: 0.04em;
      }

      .fixtures-progress__bar {
        position: relative;
        min-height: 2.05rem;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(7, 26, 61, 0.08);
        box-shadow: inset 0 0 0 1px rgba(7, 26, 61, 0.08);
      }

      .fixtures-progress__fill {
        position: absolute;
        inset: 0 auto 0 0;
        min-width: 2.05rem;
        border-radius: inherit;
        background:
          linear-gradient(90deg, var(--navy-800), var(--sky-300)),
          var(--sky-300);
        box-shadow: 0 0 24px rgba(141, 216, 255, 0.34);
        transition: width 520ms cubic-bezier(.2,.85,.2,1);
      }

      .fixtures-progress__percent {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-shadow: 0 1px 8px rgba(3, 11, 29, 0.55);
      }

      html[data-theme="dark"] .fixtures-progress {
        border-color: rgba(185, 232, 255, 0.16);
        background:
          linear-gradient(135deg, rgba(141, 216, 255, 0.09), transparent 44%),
          rgba(8, 21, 45, 0.9);
        box-shadow: 0 22px 54px rgba(0, 0, 0, 0.26);
      }

      html[data-theme="dark"] .fixtures-progress__header {
        color: rgba(237, 247, 255, 0.72);
      }

      html[data-theme="dark"] .fixtures-progress__header strong {
        color: #ffffff;
      }

      html[data-theme="dark"] .fixtures-progress__bar {
        background: rgba(237, 247, 255, 0.1);
        box-shadow: inset 0 0 0 1px rgba(185, 232, 255, 0.13);
      }

      @media (max-width: 520px) {
        .fixtures-progress {
          margin-top: -0.1rem;
        }

        .fixtures-progress__header {
          display: grid;
          gap: 0.3rem;
        }
      }
    `;

    document.head.append(style);
  }

  function updateTournamentProgress(fixtures) {
    const progress = document.querySelector("#fixtures-progress");
    if (!progress) return;

    const matches = Array.isArray(fixtures) ? fixtures : [];
    const total = matches.length;
    const finished = matches.filter(isFinishedFixture).length;
    const percent = total ? Math.round((finished / total) * 100) : 0;

    const count = progress.querySelector("[data-progress-count]");
    const bar = progress.querySelector(".fixtures-progress__bar");
    const fill = progress.querySelector(".fixtures-progress__fill");
    const label = progress.querySelector(".fixtures-progress__percent");

    if (count) count.textContent = `${finished} / ${total} finished`;
    if (bar) bar.setAttribute("aria-valuenow", String(percent));
    if (fill) fill.style.width = `${percent}%`;
    if (label) label.textContent = `${percent}%`;
  }

  function isFinishedFixture(match) {
    const status = clean(match?.status);
    if (typeof isFinishedStatus === "function" && isFinishedStatus(status)) return true;
    return /^(FT|RESULT)$/i.test(status);
  }

  function setupAnimatedFixtureDropdowns() {
    const fixtureList = document.querySelector("#fixture-list");
    if (!fixtureList || fixtureList.dataset.animatedDropdowns === "true") return;

    fixtureList.dataset.animatedDropdowns = "true";

    fixtureList.addEventListener("click", (event) => {
      const summary = event.target.closest(".fixture-day-heading");
      if (!summary || !fixtureList.contains(summary)) return;

      const details = summary.closest(".fixture-day-group");
      const panel = details?.querySelector(".fixture-day-card");
      if (!details || !panel || details.dataset.animating === "true") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      event.preventDefault();
      details.open ? animateClose(details, panel) : animateOpen(details, panel);
    });
  }

  function animateOpen(details, panel) {
    details.dataset.animating = "true";
    details.open = true;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.transform = "translateY(-10px) scale(0.985)";

    const targetHeight = `${panel.scrollHeight}px`;
    const animation = panel.animate(
      [
        { height: "0px", opacity: 0, transform: "translateY(-10px) scale(0.985)" },
        { height: targetHeight, opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      dropdownTiming()
    );

    animation.onfinish = () => finishDropdownAnimation(details, panel, true);
    animation.oncancel = () => finishDropdownAnimation(details, panel, true);
  }

  function animateClose(details, panel) {
    details.dataset.animating = "true";
    const startHeight = `${panel.offsetHeight}px`;
    panel.style.height = startHeight;
    panel.style.opacity = "1";

    const animation = panel.animate(
      [
        { height: startHeight, opacity: 1, transform: "translateY(0) scale(1)" },
        { height: "0px", opacity: 0, transform: "translateY(-10px) scale(0.985)" }
      ],
      dropdownTiming()
    );

    animation.onfinish = () => finishDropdownAnimation(details, panel, false);
    animation.oncancel = () => finishDropdownAnimation(details, panel, false);
  }

  function finishDropdownAnimation(details, panel, open) {
    details.open = open;
    delete details.dataset.animating;
    panel.style.height = "";
    panel.style.opacity = "";
    panel.style.transform = "";
  }

  function dropdownTiming() {
    return {
      duration: 360,
      easing: "cubic-bezier(.2,.85,.2,1)",
      fill: "both"
    };
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
    const groupValue = clean(match.group);
    const stage = clean(value) || groupValue || clean(match.stage);
    const groupMatch = stage.match(/Group\s+([A-L])/i);

    if (groupMatch) {
      return `Group ${groupMatch[1].toUpperCase()}`;
    }

    const cleanedStage = stage
      .replace(/FIFA\s+World\s+Cup\s*[,\-–—:]?\s*/i, "")
      .replace(/^World\s+Cup\s*[,\-–—:]?\s*/i, "")
      .trim();

    if (groupValue) return groupValue;
    if (cleanedStage && !/^group\s*stage$/i.test(cleanedStage)) return cleanedStage;
    return match.phase === "knockout" ? "Knockout" : "Group stage";
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