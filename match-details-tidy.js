(() => {
  "use strict";

  if (typeof CONFIG === "object") {
    CONFIG.cacheKey = "scotland-2026-world-cup-cache-v18";
  }

  const originalRequest = window.request;

  if (typeof originalRequest === "function") {
    window.request = async function requestWithTidyMatchDetails(endpoint, params) {
      const payload = await originalRequest(endpoint, params);

      if (endpoint === "lookuptimeline.php") {
        tidyTimelinePayload(payload);
      }

      return payload;
    };
  }

  injectSubstitutionStyles();

  document.addEventListener("DOMContentLoaded", () => {
    const fixtureList = document.querySelector("#fixture-list");
    if (!fixtureList) return;

    const observer = new MutationObserver(() => tidyRenderedMatchDetails());
    observer.observe(fixtureList, { childList: true, subtree: true });
    tidyRenderedMatchDetails();
  });

  function tidyTimelinePayload(payload) {
    timelineRows(payload).forEach((row) => {
      if (!isSubstitutionRow(row)) return;

      const change = substitutionChange(row);
      const team = clean(row.strTeam || row.team);

      row.strTimeline = "Sub";
      row.strEvent = "Sub";
      row.strType = "Sub";
      row.type = "Sub";
      row.strPlayer = changeText(change);
      row.player = row.strPlayer;
      row.strPlayerName = row.strPlayer;

      if (team) {
        row.strTeam = team;
        row.team = team;
      }
    });
  }

  function tidyRenderedMatchDetails() {
    document.querySelectorAll(".match-detail-block").forEach((block) => {
      const title = block.querySelector("h4")?.textContent.trim().toLowerCase();
      if (title === "lineups") {
        block.remove();
      }
    });

    document.querySelectorAll(".match-timeline li").forEach((item) => {
      const label = item.querySelector("strong");
      const detail = item.querySelector("p");
      if (!label || !detail || !isSubstitutionText(label.textContent)) return;

      label.textContent = "Sub";
      const parsed = parseRenderedSubstitution(detail.textContent);
      if (!parsed.on && !parsed.off) return;

      detail.innerHTML = `
        <span class="substitution-change">
          ${parsed.off ? `<span><b>Off</b>${escapeHtml(parsed.off)}</span>` : ""}
          ${parsed.off && parsed.on ? `<span class="substitution-arrow" aria-hidden="true">→</span>` : ""}
          ${parsed.on ? `<span><b>On</b>${escapeHtml(parsed.on)}</span>` : ""}
        </span>
        ${parsed.team ? `<small>${escapeHtml(parsed.team)}</small>` : ""}
      `;
    });
  }

  function timelineRows(payload) {
    if (!payload) return [];

    return [
      payload.timeline,
      payload.timelines,
      payload.event,
      payload.events,
      payload.results,
      payload.result
    ].flatMap((value) => Array.isArray(value) ? value : value ? [value] : []);
  }

  function isSubstitutionRow(row) {
    return isSubstitutionText([
      row.strTimeline,
      row.strEvent,
      row.strType,
      row.type,
      row.strComment,
      row.strDetail
    ].filter(Boolean).join(" "));
  }

  function isSubstitutionText(value) {
    return /\b(subst|substitution|substitute|sub)\b/i.test(String(value || ""));
  }

  function substitutionChange(row) {
    const on = clean(
      row.strPlayerIn ||
      row.playerIn ||
      row.strSubIn ||
      row.subIn ||
      row.strPlayer ||
      row.player ||
      row.strPlayerName
    );
    const off = clean(
      row.strPlayerOut ||
      row.playerOut ||
      row.strPlayerOff ||
      row.playerOff ||
      row.strSubOut ||
      row.subOut ||
      row.strPlayer2 ||
      row.player2 ||
      row.strAssist
    );

    return { on, off };
  }

  function changeText(change) {
    if (change.off && change.on) return `Off: ${change.off} → On: ${change.on}`;
    if (change.on) return `On: ${change.on}`;
    if (change.off) return `Off: ${change.off}`;
    return "Substitution details unavailable";
  }

  function parseRenderedSubstitution(value) {
    const [changePart, ...teamParts] = String(value || "").split(" · ");
    const team = clean(teamParts.join(" · "));
    const off = clean(changePart.match(/Off:\s*(.*?)(?:\s*→\s*On:|$)/i)?.[1]);
    const on = clean(changePart.match(/On:\s*(.*)$/i)?.[1]);

    return { off, on, team };
  }

  function injectSubstitutionStyles() {
    if (document.querySelector("#substitution-change-styles")) return;

    const style = document.createElement("style");
    style.id = "substitution-change-styles";
    style.textContent = `
      .substitution-change {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.12rem;
      }

      .substitution-change span:not(.substitution-arrow) {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.26rem 0.48rem;
        border-radius: 999px;
        background: rgba(141, 216, 255, 0.18);
        color: var(--navy-900);
        font-weight: 850;
      }

      .substitution-change b {
        color: var(--navy-700);
        font-size: 0.68rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .substitution-arrow {
        color: var(--navy-700);
        font-weight: 950;
      }

      .match-timeline p small {
        display: block;
        margin-top: 0.24rem;
        color: #667085;
        font-weight: 800;
      }
    `;

    document.head.append(style);
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
})();