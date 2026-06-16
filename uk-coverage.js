(() => {
  "use strict";

  const COVERAGE_BY_EVENT_ID = {
    // Add confirmed allocations here when BBC/ITV publish them, e.g.
    // "66456930": { channel: "BBC One", stream: "BBC iPlayer" }
  };

  const COVERAGE_BY_MATCH_KEY = {
    // Optional fallback by team/date key, e.g.
    // "2026-06-13|haiti|scotland": { channel: "BBC One", stream: "BBC iPlayer" }
  };

  window.UK_COVERAGE_BY_EVENT_ID = {
    ...(window.UK_COVERAGE_BY_EVENT_ID || {}),
    ...COVERAGE_BY_EVENT_ID
  };

  window.UK_COVERAGE_BY_MATCH_KEY = {
    ...(window.UK_COVERAGE_BY_MATCH_KEY || {}),
    ...COVERAGE_BY_MATCH_KEY
  };

  installCoverageStyles();
  document.addEventListener("DOMContentLoaded", setupCoverageObserver);

  window.getUkCoverage = function getUkCoverage(matchOrCard) {
    const eventId = cleanText(matchOrCard?.id || matchOrCard?.dataset?.eventId);
    const direct = eventId ? window.UK_COVERAGE_BY_EVENT_ID?.[eventId] : null;
    if (direct) return normaliseCoverage(direct);

    const key = matchKey(matchOrCard);
    const fallback = key ? window.UK_COVERAGE_BY_MATCH_KEY?.[key] : null;
    if (fallback) return normaliseCoverage(fallback);

    return {
      channel: "UK coverage TBC",
      stream: "",
      confirmed: false
    };
  };

  function setupCoverageObserver() {
    decorateCoverageCards();

    ["#fixture-list", "#today-fixture-list"].forEach((selector) => {
      const target = document.querySelector(selector);
      if (!target) return;

      new MutationObserver(decorateCoverageCards).observe(target, {
        childList: true,
        subtree: true
      });
    });
  }

  function decorateCoverageCards() {
    document.querySelectorAll(".fixture-card[data-event-id]").forEach((card) => {
      if (card.dataset.coverageDecorated === "true") return;

      const stack = card.querySelector(".fixture-status-stack") || card;
      const coverage = window.getUkCoverage(card);
      const pill = document.createElement("span");
      pill.className = `fixture-coverage-pill${coverage.confirmed ? " is-confirmed" : " is-tbc"}`;
      pill.textContent = coverage.stream ? `${coverage.channel} • ${coverage.stream}` : coverage.channel;
      pill.setAttribute("aria-label", `UK coverage: ${pill.textContent}`);

      stack.append(pill);
      card.dataset.coverageDecorated = "true";
    });
  }

  function normaliseCoverage(value) {
    if (typeof value === "string") {
      return {
        channel: value,
        stream: "",
        confirmed: true
      };
    }

    return {
      channel: cleanText(value?.channel) || "UK coverage TBC",
      stream: cleanText(value?.stream),
      confirmed: value?.confirmed !== false && Boolean(cleanText(value?.channel))
    };
  }

  function matchKey(matchOrCard) {
    const card = matchOrCard?.dataset ? matchOrCard : null;
    const home = normaliseTeam(matchOrCard?.home || card?.dataset?.homeTeam);
    const away = normaliseTeam(matchOrCard?.away || card?.dataset?.awayTeam);
    const date = matchDate(matchOrCard?.kickoff || card?.dataset?.kickoff);

    if (!home || !away || !date) return "";

    return [date, ...[home, away].sort()].join("|");
  }

  function matchDate(value) {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function normaliseTeam(value) {
    return cleanText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/\bthe\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function installCoverageStyles() {
    if (document.querySelector("#uk-coverage-styles")) return;

    const style = document.createElement("style");
    style.id = "uk-coverage-styles";
    style.textContent = `
      .fixture-coverage-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        max-width: 12rem;
        padding: 0.28rem 0.54rem;
        border: 1px solid rgba(7, 26, 61, 0.1);
        border-radius: 999px;
        color: rgba(7, 26, 61, 0.72);
        background: rgba(255, 255, 255, 0.72);
        font-size: 0.64rem;
        font-weight: 950;
        letter-spacing: 0.08em;
        line-height: 1.1;
        text-align: center;
        text-transform: uppercase;
        white-space: normal;
      }

      .fixture-coverage-pill.is-confirmed {
        color: #05295e;
        border-color: rgba(141, 216, 255, 0.5);
        background: rgba(141, 216, 255, 0.22);
      }

      html[data-theme="dark"] .fixture-coverage-pill {
        color: rgba(237, 247, 255, 0.84) !important;
        border-color: rgba(185, 232, 255, 0.18) !important;
        background: rgba(141, 216, 255, 0.1) !important;
      }

      html[data-theme="dark"] .fixture-coverage-pill.is-confirmed {
        color: #ffffff !important;
        border-color: rgba(141, 216, 255, 0.42) !important;
        background: rgba(141, 216, 255, 0.2) !important;
      }
    `;

    document.head.append(style);
  }
})();
