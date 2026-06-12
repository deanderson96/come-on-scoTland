const SITE_LAST_UPDATED = "2026-06-12T12:00:00+01:00";

const GROUPS = [
  {
    name: "Group A",
    teams: [
      { team: "Mexico", w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { team: "South Korea", w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
      { team: "Czechia", w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
      { team: "South Africa", w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 }
    ]
  },
  {
    name: "Group B",
    teams: ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"].map(blankTeam)
  },
  {
    name: "Group C",
    teams: ["Brazil", "Morocco", "Haiti", "Scotland"].map(blankTeam)
  },
  {
    name: "Group D",
    teams: ["United States", "Paraguay", "Australia", "Türkiye"].map(blankTeam)
  },
  {
    name: "Group E",
    teams: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"].map(blankTeam)
  },
  {
    name: "Group F",
    teams: ["Netherlands", "Japan", "Sweden", "Tunisia"].map(blankTeam)
  },
  {
    name: "Group G",
    teams: ["Belgium", "Egypt", "Iran", "New Zealand"].map(blankTeam)
  },
  {
    name: "Group H",
    teams: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"].map(blankTeam)
  },
  {
    name: "Group I",
    teams: ["France", "Senegal", "Iraq", "Norway"].map(blankTeam)
  },
  {
    name: "Group J",
    teams: ["Argentina", "Algeria", "Austria", "Jordan"].map(blankTeam)
  },
  {
    name: "Group K",
    teams: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"].map(blankTeam)
  },
  {
    name: "Group L",
    teams: ["England", "Croatia", "Ghana", "Panama"].map(blankTeam)
  }
];

const FIXTURES = [
  // Played / early fixtures
  result("Group A", "2026-06-11", "20:00", "Mexico", "South Africa", "Mexico City, Mexico", "2-0"),
  result("Group A", "2026-06-12", "03:00", "South Korea", "Czechia", "Zapopan, Mexico", "2-1"),
  fixture("Group B", "2026-06-12", "20:00", "Canada", "Bosnia & Herzegovina", "Toronto, Canada"),

  // Saturday, June 13
  fixture("Group D", "2026-06-13", "02:00", "United States", "Paraguay", "Los Angeles, USA"),
  fixture("Group B", "2026-06-13", "20:00", "Qatar", "Switzerland", "Santa Clara, USA"),
  fixture("Group C", "2026-06-13", "23:00", "Brazil", "Morocco", "New Jersey, USA"),

  // Sunday, June 14
  fixture("Group C", "2026-06-14", "02:00", "Haiti", "Scotland", "Foxborough, USA"),
  fixture("Group D", "2026-06-14", "05:00", "Australia", "Türkiye", "Vancouver, Canada"),
  fixture("Group E", "2026-06-14", "18:00", "Germany", "Curaçao", "Houston, USA"),
  fixture("Group F", "2026-06-14", "21:00", "Netherlands", "Japan", "Arlington, USA"),

  // Monday, June 15
  fixture("Group E", "2026-06-15", "00:00", "Ivory Coast", "Ecuador", "Philadelphia, USA"),
  fixture("Group F", "2026-06-15", "03:00", "Sweden", "Tunisia", "Guadalupe, Mexico"),
  fixture("Group H", "2026-06-15", "17:00", "Spain", "Cabo Verde", "Atlanta, USA"),
  fixture("Group G", "2026-06-15", "20:00", "Belgium", "Egypt", "Seattle, USA"),
  fixture("Group H", "2026-06-15", "23:00", "Saudi Arabia", "Uruguay", "Miami, USA"),

  // Tuesday, June 16
  fixture("Group G", "2026-06-16", "02:00", "Iran", "New Zealand", "Los Angeles, USA"),
  fixture("Group I", "2026-06-16", "20:00", "France", "Senegal", "New Jersey, USA"),
  fixture("Group I", "2026-06-16", "23:00", "Iraq", "Norway", "Foxborough, USA"),

  // Wednesday, June 17
  fixture("Group J", "2026-06-17", "02:00", "Argentina", "Algeria", "Kansas City, USA"),
  fixture("Group J", "2026-06-17", "05:00", "Austria", "Jordan", "Santa Clara, USA"),
  fixture("Group K", "2026-06-17", "18:00", "Portugal", "DR Congo", "Houston, USA"),
  fixture("Group L", "2026-06-17", "21:00", "England", "Croatia", "Arlington, USA"),

  // Thursday, June 18
  fixture("Group L", "2026-06-18", "00:00", "Ghana", "Panama", "Toronto, Canada"),
  fixture("Group K", "2026-06-18", "03:00", "Uzbekistan", "Colombia", "Mexico City, Mexico"),
  fixture("Group A", "2026-06-18", "17:00", "Czechia", "South Africa", "Atlanta, USA"),
  fixture("Group B", "2026-06-18", "20:00", "Switzerland", "Bosnia & Herzegovina", "Los Angeles, USA"),
  fixture("Group B", "2026-06-18", "23:00", "Canada", "Qatar", "Vancouver, Canada"),

  // Friday, June 19
  fixture("Group A", "2026-06-19", "02:00", "Mexico", "South Korea", "Zapopan, Mexico"),
  fixture("Group D", "2026-06-19", "20:00", "United States", "Australia", "Seattle, USA"),
  fixture("Group C", "2026-06-19", "23:00", "Scotland", "Morocco", "Foxborough, USA"),

  // Saturday, June 20
  fixture("Group C", "2026-06-20", "01:30", "Brazil", "Haiti", "Philadelphia, USA"),
  fixture("Group D", "2026-06-20", "04:00", "Türkiye", "Paraguay", "Santa Clara, USA"),
  fixture("Group F", "2026-06-20", "18:00", "Netherlands", "Sweden", "Houston, USA"),
  fixture("Group E", "2026-06-20", "21:00", "Germany", "Ivory Coast", "Toronto, Canada"),

  // Sunday, June 21
  fixture("Group E", "2026-06-21", "01:00", "Ecuador", "Curaçao", "Kansas City, USA"),
  fixture("Group F", "2026-06-21", "05:00", "Tunisia", "Japan", "Guadalupe, Mexico"),
  fixture("Group H", "2026-06-21", "17:00", "Spain", "Saudi Arabia", "Atlanta, USA"),
  fixture("Group G", "2026-06-21", "20:00", "Belgium", "Iran", "Los Angeles, USA"),
  fixture("Group H", "2026-06-21", "23:00", "Uruguay", "Cabo Verde", "Miami, USA"),

  // Monday, June 22
  fixture("Group G", "2026-06-22", "02:00", "New Zealand", "Egypt", "Vancouver, Canada"),
  fixture("Group J", "2026-06-22", "18:00", "Argentina", "Austria", "Arlington, USA"),
  fixture("Group I", "2026-06-22", "22:00", "France", "Iraq", "Philadelphia, USA"),

  // Tuesday, June 23
  fixture("Group I", "2026-06-23", "01:00", "Norway", "Senegal", "Toronto, Canada"),
  fixture("Group J", "2026-06-23", "04:00", "Jordan", "Algeria", "Santa Clara, USA"),
  fixture("Group K", "2026-06-23", "18:00", "Portugal", "Uzbekistan", "Houston, USA"),
  fixture("Group L", "2026-06-23", "21:00", "England", "Ghana", "Foxborough, USA"),

  // Wednesday, June 24
  fixture("Group L", "2026-06-24", "00:00", "Panama", "Croatia", "Foxborough, USA"),
  fixture("Group K", "2026-06-24", "03:00", "Colombia", "DR Congo", "Zapopan, Mexico"),
  fixture("Group B", "2026-06-24", "20:00", "Switzerland", "Canada", "Vancouver, Canada"),
  fixture("Group B", "2026-06-24", "20:00", "Bosnia & Herzegovina", "Qatar", "Seattle, USA"),
  fixture("Group C", "2026-06-24", "23:00", "Morocco", "Haiti", "Atlanta, USA"),
  fixture("Group C", "2026-06-24", "23:00", "Scotland", "Brazil", "Miami, USA"),

  // Thursday, June 25
  fixture("Group A", "2026-06-25", "02:00", "South Africa", "South Korea", "Guadalupe, Mexico"),
  fixture("Group A", "2026-06-25", "02:00", "Czechia", "Mexico", "Mexico City, Mexico"),
  fixture("Group E", "2026-06-25", "21:00", "Curaçao", "Ivory Coast", "Philadelphia, USA"),
  fixture("Group E", "2026-06-25", "21:00", "Ecuador", "Germany", "New Jersey, USA"),

  // Friday, June 26
  fixture("Group F", "2026-06-26", "00:00", "Tunisia", "Netherlands", "Kansas City, USA"),
  fixture("Group F", "2026-06-26", "00:00", "Japan", "Sweden", "Arlington, USA"),
  fixture("Group D", "2026-06-26", "03:00", "Türkiye", "United States", "Los Angeles, USA"),
  fixture("Group D", "2026-06-26", "03:00", "Paraguay", "Australia", "Santa Clara, USA"),
  fixture("Group I", "2026-06-26", "20:00", "Norway", "France", "Foxborough, USA"),
  fixture("Group I", "2026-06-26", "20:00", "Senegal", "Iraq", "Toronto, Canada"),

  // Saturday, June 27
  fixture("Group H", "2026-06-27", "01:00", "Cabo Verde", "Saudi Arabia", "Houston, USA"),
  fixture("Group H", "2026-06-27", "01:00", "Uruguay", "Spain", "Zapopan, Mexico"),
  fixture("Group G", "2026-06-27", "04:00", "New Zealand", "Belgium", "Vancouver, Canada"),
  fixture("Group G", "2026-06-27", "04:00", "Egypt", "Iran", "Seattle, USA"),
  fixture("Group L", "2026-06-27", "22:00", "Panama", "England", "New Jersey, USA"),
  fixture("Group L", "2026-06-27", "22:00", "Croatia", "Ghana", "Philadelphia, USA"),

  // Sunday, June 28
  fixture("Group K", "2026-06-28", "00:30", "Colombia", "Portugal", "Miami, USA"),
  fixture("Group K", "2026-06-28", "00:30", "DR Congo", "Uzbekistan", "Atlanta, USA"),
  fixture("Group J", "2026-06-28", "03:00", "Algeria", "Austria", "Kansas City, USA"),
  fixture("Group J", "2026-06-28", "03:00", "Jordan", "Argentina", "Arlington, USA"),

  // Knockout stage
  knockout("Round of 32", "Match 73", "2026-06-28", "20:00", "Group A runners-up", "Group B runners-up", "Los Angeles, USA"),
  knockout("Round of 32", "Match 76", "2026-06-29", "18:00", "Group C winners", "Group F runners-up", "Houston, USA"),
  knockout("Round of 32", "Match 74", "2026-06-29", "21:30", "Group E winners", "A/B/C/D/F third place", "Foxborough, USA"),
  knockout("Round of 32", "Match 75", "2026-06-30", "02:00", "Group F winners", "Group C runners-up", "Guadalupe, Mexico"),
  knockout("Round of 32", "Match 78", "2026-06-30", "18:00", "Group E runners-up", "Group I runners-up", "Arlington, USA"),
  knockout("Round of 32", "Match 77", "2026-06-30", "22:00", "Group I winners", "C/D/F/G/H third place", "New Jersey, USA"),
  knockout("Round of 32", "Match 79", "2026-07-01", "02:00", "Group A winners", "C/E/F/H/I third place", "Mexico City, Mexico"),
  knockout("Round of 32", "Match 80", "2026-07-01", "17:00", "Group L winners", "E/H/I/J/K third place", "Atlanta, USA"),
  knockout("Round of 32", "Match 82", "2026-07-01", "21:00", "Group G winners", "A/E/H/I/J third place", "Seattle, USA"),
  knockout("Round of 32", "Match 81", "2026-07-02", "01:00", "Group D winners", "B/E/F/I/J third place", "Santa Clara, USA"),
  knockout("Round of 32", "Match 84", "2026-07-02", "20:00", "Group H winners", "Group J runners-up", "Los Angeles, USA"),
  knockout("Round of 32", "Match 83", "2026-07-03", "00:00", "Group K runners-up", "Group L runners-up", "Toronto, Canada"),
  knockout("Round of 32", "Match 85", "2026-07-03", "04:00", "Group B winners", "E/F/G/I/J third place", "Vancouver, Canada"),
  knockout("Round of 32", "Match 88", "2026-07-03", "19:00", "Group D runners-up", "Group G runners-up", "Arlington, USA"),
  knockout("Round of 32", "Match 86", "2026-07-03", "23:00", "Group J winners", "Group H runners-up", "Miami, USA"),
  knockout("Round of 32", "Match 87", "2026-07-04", "02:30", "Group K winners", "D/E/I/J/L third place", "Kansas City, USA"),

  knockout("Round of 16", "Match 90", "2026-07-04", "18:00", "Match 73 winners", "Match 75 winners", "Houston, USA"),
  knockout("Round of 16", "Match 89", "2026-07-04", "22:00", "Match 74 winners", "Match 77 winners", "Philadelphia, USA"),
  knockout("Round of 16", "Match 91", "2026-07-05", "21:00", "Match 76 winners", "Match 78 winners", "New Jersey, USA"),
  knockout("Round of 16", "Match 92", "2026-07-06", "01:00", "Match 79 winners", "Match 80 winners", "Mexico City, Mexico"),
  knockout("Round of 16", "Match 93", "2026-07-06", "20:00", "Match 83 winners", "Match 84 winners", "Arlington, USA"),
  knockout("Round of 16", "Match 94", "2026-07-07", "01:00", "Match 81 winners", "Match 82 winners", "Seattle, USA"),
  knockout("Round of 16", "Match 95", "2026-07-07", "17:00", "Match 86 winners", "Match 88 winners", "Atlanta, USA"),
  knockout("Round of 16", "Match 96", "2026-07-07", "21:00", "Match 85 winners", "Match 87 winners", "Vancouver, Canada"),

  knockout("Quarter-final", "Match 97", "2026-07-09", "21:00", "Match 89 winners", "Match 90 winners", "Foxborough, USA"),
  knockout("Quarter-final", "Match 98", "2026-07-10", "20:00", "Match 93 winners", "Match 94 winners", "Los Angeles, USA"),
  knockout("Quarter-final", "Match 99", "2026-07-11", "22:00", "Match 91 winners", "Match 92 winners", "Miami, USA"),
  knockout("Quarter-final", "Match 100", "2026-07-12", "02:00", "Match 95 winners", "Match 96 winners", "Kansas City, USA"),

  knockout("Semi-final", "Match 101", "2026-07-14", "20:00", "Match 97 winners", "Match 98 winners", "Arlington, USA"),
  knockout("Semi-final", "Match 102", "2026-07-15", "20:00", "Match 99 winners", "Match 100 winners", "Atlanta, USA"),

  knockout("Bronze final", "Match 103", "2026-07-18", "22:00", "Match 101 losers", "Match 102 losers", "Miami, USA"),
  knockout("Final", "Match 104", "2026-07-19", "20:00", "Match 101 winners", "Match 102 winners", "New Jersey, USA")
];

const els = {
  navToggle: document.querySelector(".nav-toggle"),
  navMenu: document.querySelector("#nav-menu"),
  fixtureList: document.querySelector("#fixture-list"),
  groupsGrid: document.querySelector("#groups-grid"),
  knockoutGrid: document.querySelector("#knockout-grid"),
  filterButtons: document.querySelectorAll(".filter-button"),
  year: document.querySelector("#year"),
  heroLastUpdated: document.querySelector("#hero-last-updated"),
  footerLastUpdated: document.querySelector("#footer-last-updated")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  setupNavigation();
  setupFilters();
  setLastUpdated();

  els.year.textContent = String(new Date().getFullYear());

  renderFixtures("all");
  renderGroups();
  renderKnockout();
}

function setupNavigation() {
  if (!els.navToggle || !els.navMenu) return;

  els.navToggle.addEventListener("click", () => {
    const isOpen = els.navMenu.classList.toggle("is-open");
    els.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  els.navMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      els.navMenu.classList.remove("is-open");
      els.navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderFixtures(button.dataset.filter || "all");
    });
  });
}

function setLastUpdated() {
  const formatted = formatLongDateTime(SITE_LAST_UPDATED);

  [els.heroLastUpdated, els.footerLastUpdated].forEach((el) => {
    if (!el) return;
    el.textContent = formatted;
    el.dateTime = SITE_LAST_UPDATED;
  });
}

function renderFixtures(filter) {
  const filtered = FIXTURES.filter((match) => {
    if (filter === "scotland") return involvesScotland(match);
    if (filter === "group") return match.phase === "group";
    if (filter === "knockout") return match.phase === "knockout";
    return true;
  });

  els.fixtureList.innerHTML = filtered
    .sort((a, b) => sortByDateTime(a, b))
    .map(renderFixtureCard)
    .join("");
}

function renderFixtureCard(match) {
  const isScotland = involvesScotland(match);

  return `
    <article class="fixture-card ${isScotland ? "is-scotland" : ""}">
      <div class="fixture-date">
        ${formatShortDate(match.date)}
        <strong>${match.time} BST</strong>
      </div>

      <div class="fixture-main">
        <span class="fixture-stage">${escapeHtml(match.stage)}</span>
        <div class="fixture-teams">
          <span>${escapeHtml(match.home)}</span>
          ${
            match.score
              ? `<span class="fixture-score">${escapeHtml(match.score)}</span>`
              : `<span aria-hidden="true">v</span>`
          }
          <span>${escapeHtml(match.away)}</span>
        </div>
        <div class="fixture-meta">
          ${escapeHtml(match.venue)}${match.code ? ` • ${escapeHtml(match.code)}` : ""}
        </div>
      </div>

      <span class="fixture-status">${match.score ? "Result" : match.phase}</span>
    </article>
  `;
}

function renderGroups() {
  els.groupsGrid.innerHTML = GROUPS.map((group) => {
    const rows = [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdDiff = goalDifference(b) - goalDifference(a);
      if (gdDiff !== 0) return gdDiff;
      return b.gf - a.gf;
    });

    return `
      <article class="group-card">
        <div class="group-header">
          <span class="group-label">${escapeHtml(group.name)}</span>
          <span class="group-label">P W D L GD Pts</span>
        </div>

        <table>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">P</th>
              <th scope="col">W</th>
              <th scope="col">D</th>
              <th scope="col">L</th>
              <th scope="col">GD</th>
              <th scope="col">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(renderGroupRow).join("")}
          </tbody>
        </table>
      </article>
    `;
  }).join("");
}

function renderGroupRow(row) {
  const played = row.w + row.d + row.l;
  const isScotland = row.team === "Scotland";

  return `
    <tr class="${isScotland ? "is-scotland" : ""}">
      <td>
        <span class="team-name">
          <span class="team-dot" aria-hidden="true"></span>
          ${escapeHtml(row.team)}
        </span>
      </td>
      <td>${played}</td>
      <td>${row.w}</td>
      <td>${row.d}</td>
      <td>${row.l}</td>
      <td>${formatGoalDifference(goalDifference(row))}</td>
      <td><strong>${row.pts}</strong></td>
    </tr>
  `;
}

function renderKnockout() {
  const knockoutMatches = FIXTURES.filter((match) => match.phase === "knockout");

  els.knockoutGrid.innerHTML = knockoutMatches
    .sort((a, b) => sortByDateTime(a, b))
    .map((match) => `
      <article class="knockout-card">
        <span class="knockout-round">${escapeHtml(match.stage)} • ${escapeHtml(match.code)}</span>
        <h3>${escapeHtml(match.home)} v ${escapeHtml(match.away)}</h3>
        <p><strong>${formatShortDate(match.date)} • ${match.time} BST</strong></p>
        <p>${escapeHtml(match.venue)}</p>
      </article>
    `)
    .join("");
}

function fixture(stage, date, time, home, away, venue) {
  return {
    phase: "group",
    stage,
    date,
    time,
    home,
    away,
    venue,
    score: ""
  };
}

function result(stage, date, time, home, away, venue, score) {
  return {
    phase: "group",
    stage,
    date,
    time,
    home,
    away,
    venue,
    score
  };
}

function knockout(stage, code, date, time, home, away, venue) {
  return {
    phase: "knockout",
    stage,
    code,
    date,
    time,
    home,
    away,
    venue,
    score: ""
  };
}

function blankTeam(team) {
  return {
    team,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    pts: 0
  };
}

function involvesScotland(match) {
  return match.home === "Scotland" || match.away === "Scotland";
}

function goalDifference(row) {
  return row.gf - row.ga;
}

function formatGoalDifference(value) {
  return value > 0 ? `+${value}` : String(value);
}

function sortByDateTime(a, b) {
  return toSortableDate(a.date, a.time) - toSortableDate(b.date, b.time);
}

/**
 * All source fixture times are stored as BST local time.
 * This creates a sortable timestamp by treating BST as UTC+1.
 */
function toSortableDate(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour - 1, minute);
}

function formatShortDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(date);
}

function formatLongDateTime(isoString) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short"
  }).format(new Date(isoString));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
