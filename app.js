const $ = sel => document.querySelector(sel);
const fmt = d => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
const fixtures = WC_DATA.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date)).map(f => ({ ...f }));

function init() {
  $('#themeToggle').onclick = () => document.body.classList.toggle('dark');
  renderStats();
  renderFilters();
  renderFixtures();
  renderScotland();
  renderGroups();
  renderBracket();
  ['searchInput', 'roundFilter', 'groupFilter'].forEach(id => $('#'+id).addEventListener('input', renderFixtures));
}

function renderStats() {
  const scot = fixtures.filter(f => [f.home, f.away].includes('Scotland'));
  const completed = fixtures.filter(isFinished).length;
  const goals = fixtures.reduce((sum, f) => sum + (Number.isFinite(f.homeScore) ? f.homeScore : 0) + (Number.isFinite(f.awayScore) ? f.awayScore : 0), 0);
  $('#stats').innerHTML = [
    ['48', 'Teams'],
    [fixtures.length, 'Fixtures tracked'],
    [completed, 'Results entered'],
    [goals, 'Goals recorded']
  ].map(x => `<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
  const next = scot.find(f => new Date(f.date) > new Date() && !isFinished(f));
  $('#nextScotlandMatch').innerHTML = next ? `<b>Next up</b><br>${scoreLine(next)}<br><span>${fmt(next.date)}</span>` : 'Scotland fixtures complete';
}

function renderFilters() {
  [...new Set(fixtures.map(f => f.round))].forEach(r => $('#roundFilter').insertAdjacentHTML('beforeend', `<option>${r}</option>`));
  Object.keys(WC_DATA.groups).forEach(g => $('#groupFilter').insertAdjacentHTML('beforeend', `<option>${g}</option>`));
}

function filterList() {
  const q = $('#searchInput').value.toLowerCase();
  const r = $('#roundFilter').value;
  const g = $('#groupFilter').value;
  return fixtures.filter(f =>
    (r === 'all' || f.round === r) &&
    (g === 'all' || f.group === g) &&
    JSON.stringify(f).toLowerCase().includes(q)
  );
}

function renderFixtures() {
  $('#fixtureRows').innerHTML = filterList().map(f => `<tr class="${[f.home, f.away].includes('Scotland') ? 'row-scotland' : ''}"><td>${fmt(f.date)}</td><td><span class="badge">${f.round}${f.group !== 'Knockout' ? ` ${f.group}` : ''}</span></td><td><b>${scoreLine(f)}</b></td><td>${f.venue}</td><td>${statusBadge(f)}</td></tr>`).join('');
}

function renderScotland() {
  $('#scotlandFixtures').innerHTML = fixtures.filter(f => [f.home, f.away].includes('Scotland')).map(f => `<article class="match-card scotland"><span class="badge">${f.group === 'Knockout' ? f.round : 'Group ' + f.group}</span><div class="teams">${scoreLine(f)}</div><p class="meta">${fmt(f.date)}<br>${f.venue}<br>${statusText(f)}</p></article>`).join('');
}

function renderGroups() {
  $('#groupTables').innerHTML = Object.entries(WC_DATA.groups).map(([g, teams]) => `<div class="group-table"><h3>Group ${g}</h3><table><thead><tr><th>Team</th><th>P</th><th>Pts</th><th>GD</th></tr></thead><tbody>${tableFor(g, teams)}</tbody></table></div>`).join('');
}

function tableFor(group, teams) {
  const rows = teams.map(t => ({ t, p: 0, pts: 0, gf: 0, ga: 0 }));
  fixtures.filter(f => f.group === group && hasScore(f) && isFinished(f)).forEach(f => {
    const h = rows.find(x => x.t === f.home);
    const a = rows.find(x => x.t === f.away);
    if (!h || !a) return;
    h.p++; a.p++;
    h.gf += f.homeScore; h.ga += f.awayScore;
    a.gf += f.awayScore; a.ga += f.homeScore;
    if (f.homeScore > f.awayScore) h.pts += 3;
    else if (f.homeScore < f.awayScore) a.pts += 3;
    else { h.pts++; a.pts++; }
  });
  return rows
    .sort((a, b) => b.pts - a.pts || ((b.gf - b.ga) - (a.gf - a.ga)) || b.gf - a.gf)
    .map(x => `<tr><td>${x.t === 'Scotland' ? '🏴 ' : ''}${x.t}</td><td>${x.p}</td><td>${x.pts}</td><td>${x.gf - x.ga}</td></tr>`)
    .join('');
}

function renderBracket() {
  const rounds = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third-place play-off', 'Final'];
  $('#bracket').innerHTML = rounds.map(r => `<div class="round"><h3>${r}</h3>${fixtures.filter(f => f.round === r).map(f => `<div class="tie"><b>${scoreLine(f)}</b><p class="meta">${fmt(f.date)}<br>${statusText(f)}</p></div>`).join('')}</div>`).join('');
}

function scoreLine(f) {
  return hasScore(f) ? `${f.home} ${f.homeScore}–${f.awayScore} ${f.away}` : `${f.home} vs ${f.away}`;
}

function statusText(f) {
  return f.status || 'Future';
}

function statusBadge(f) {
  return `<span class="badge">${statusText(f)}</span>`;
}

function hasScore(f) {
  return Number.isFinite(f.homeScore) && Number.isFinite(f.awayScore);
}

function isFinished(f) {
  return /finished|full.?time|ft|aet|penalties|complete/i.test(String(f.status));
}

init();
