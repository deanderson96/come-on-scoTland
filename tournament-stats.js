(() => {
  "use strict";

  const originalApplyData = typeof applyData === "function" ? applyData : null;

  if (originalApplyData) {
    applyData = function applyDataWithTournamentStats(data) {
      originalApplyData(data);
      renderTournamentStats(state?.fixtures || []);
    };
    window.applyData = applyData;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTournamentStats();
    renderTournamentStats(state?.fixtures || []);
  });

  function setupTournamentStats() {
    if (document.querySelector("#tournament-stats")) return;

    installStatsStyles();

    const progress = document.querySelector("#fixtures-progress");
    const toolbar = document.querySelector("#fixtures .toolbar");
    const anchor = progress || toolbar;
    if (!anchor) return;

    const panel = document.createElement("div");
    panel.id = "tournament-stats";
    panel.className = "tournament-stats";
    panel.setAttribute("aria-label", "Tournament statistics");
    panel.innerHTML = statCardsMarkup({
      totalGoals: 0,
      scorelines: 0,
      matchesWithGoals: 0,
      finishedMatches: 0,
      liveMatches: 0,
      goalsPerMatch: "0.00"
    });

    anchor.insertAdjacentElement("afterend", panel);
  }

  function renderTournamentStats(fixtures) {
    const panel = document.querySelector("#tournament-stats");
    if (!panel) return;

    const matches = Array.isArray(fixtures) ? fixtures : [];
    const scorelines = matches
      .map((match) => ({ match, score: parseScore(match.score) }))
      .filter((item) => item.score);
    const matchesWithGoals = scorelines.filter((item) => item.score.home + item.score.away > 0);

    const totalGoals = scorelines.reduce((total, item) => total + item.score.home + item.score.away, 0);
    const finishedMatches = matches.filter(isFinishedFixture).length;
    const liveMatches = matches.filter(isLiveFixture).length;
    const goalsPerMatch = scorelines.length ? (totalGoals / scorelines.length).toFixed(2) : "0.00";

    panel.innerHTML = statCardsMarkup({
      totalGoals,
      scorelines: scorelines.length,
      matchesWithGoals: matchesWithGoals.length,
      finishedMatches,
      liveMatches,
      goalsPerMatch
    });
  }

  function statCardsMarkup(stats) {
    return `
      <article class="tournament-stat-card">
        <span>Total goals</span>
        <strong>${stats.totalGoals}</strong>
        <small>Across matches with a scoreline</small>
      </article>
      <article class="tournament-stat-card">
        <span>Matches with goals</span>
        <strong>${stats.matchesWithGoals}</strong>
        <small>Excludes 0–0 scorelines</small>
      </article>
      <article class="tournament-stat-card">
        <span>Finished</span>
        <strong>${stats.finishedMatches}</strong>
        <small>Matches marked as complete</small>
      </article>
      <article class="tournament-stat-card">
        <span>Live now</span>
        <strong>${stats.liveMatches}</strong>
        <small>Matches currently in play</small>
      </article>
      <article class="tournament-stat-card">
        <span>Goals/match</span>
        <strong>${stats.goalsPerMatch}</strong>
        <small>Average from all scorelines, including 0–0</small>
      </article>`;
  }

  function parseScore(value) {
    const match = String(value || "").match(/^(\d+)\s*[-:–—]\s*(\d+)$/);
    if (!match) return null;

    return {
      home: Number(match[1]),
      away: Number(match[2])
    };
  }

  function isFinishedFixture(match) {
    const status = cleanText(match?.status).toLowerCase();
    if (typeof isFinishedStatus === "function" && isFinishedStatus(status)) return true;
    return /^(ft|result)$/.test(status);
  }

  function isLiveFixture(match) {
    const status = cleanText(match?.status).toLowerCase();
    if (match?.isLive) return true;
    if (typeof isLiveStatus === "function" && isLiveStatus(status)) return true;
    return /^(1h|2h|ht|et1h|et2h|pen)$/.test(status);
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function installStatsStyles() {
    if (document.querySelector("#tournament-stats-styles")) return;

    const style = document.createElement("style");
    style.id = "tournament-stats-styles";
    style.textContent = `
      .tournament-stats {
        width: min(var(--shell), calc(100% - 2rem));
        margin: -0.55rem auto 1.55rem;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .tournament-stat-card {
        position: relative;
        overflow: hidden;
        padding: 0.92rem;
        border: 1px solid rgba(7, 26, 61, 0.1);
        border-radius: 20px;
        background:
          linear-gradient(135deg, rgba(141, 216, 255, 0.18), transparent 48%),
          rgba(255, 255, 255, 0.84);
        box-shadow: 0 18px 42px rgba(7, 26, 61, 0.08);
      }

      .tournament-stat-card::after {
        content: "";
        position: absolute;
        inset: auto -18% -48% 36%;
        height: 5.5rem;
        border-radius: 999px;
        background: rgba(141, 216, 255, 0.18);
        transform: rotate(-12deg);
      }

      .tournament-stat-card span,
      .tournament-stat-card strong,
      .tournament-stat-card small {
        position: relative;
        z-index: 1;
      }

      .tournament-stat-card span {
        display: block;
        color: rgba(7, 26, 61, 0.62);
        font-size: 0.68rem;
        font-weight: 950;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .tournament-stat-card strong {
        display: block;
        margin-top: 0.36rem;
        color: var(--navy-900);
        font-size: clamp(1.55rem, 4vw, 2.35rem);
        line-height: 0.95;
      }

      .tournament-stat-card small {
        display: block;
        margin-top: 0.42rem;
        color: rgba(7, 26, 61, 0.62);
        font-size: 0.75rem;
        font-weight: 800;
        line-height: 1.3;
      }

      html[data-theme="dark"] .tournament-stat-card {
        border-color: rgba(185, 232, 255, 0.16);
        background:
          linear-gradient(135deg, rgba(141, 216, 255, 0.1), transparent 48%),
          rgba(8, 21, 45, 0.9);
        box-shadow: 0 22px 54px rgba(0, 0, 0, 0.24);
      }

      html[data-theme="dark"] .tournament-stat-card span,
      html[data-theme="dark"] .tournament-stat-card small {
        color: rgba(237, 247, 255, 0.72) !important;
      }

      html[data-theme="dark"] .tournament-stat-card strong {
        color: #ffffff !important;
      }

      @media (max-width: 980px) {
        .tournament-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 560px) {
        .tournament-stats {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.append(style);
  }
})();
