(() => {
  "use strict";

  if (document.querySelector("#dark-mode-contrast-patch")) return;

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
})();
