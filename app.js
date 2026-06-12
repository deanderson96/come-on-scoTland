const $ = sel => document.querySelector(sel);
const fmt = d => new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d));
const fixtures = WC_DATA.fixtures.sort((a,b)=>new Date(a.date)-new Date(b.date));
let liveFixtures = fixtures.map(f => ({...f}));
let liveTimer;

function init(){
  $('#themeToggle').onclick=()=>document.body.classList.toggle('dark');
  $('#refreshLive').onclick=()=>loadLiveScores(true);
  renderStats(); renderFilters(); renderFixtures(); renderScotland(); renderGroups(); renderBracket(); renderLiveScores(); loadLiveScores();
  ['searchInput','roundFilter','groupFilter'].forEach(id=>$('#'+id).addEventListener('input',renderFixtures));
}
function renderStats(){
 const scot=liveFixtures.filter(f=>[f.home,f.away].includes('Scotland'));
 $('#stats').innerHTML=[['48','Teams'],['104','Fixtures tracked'],['12','Groups'],[scot.length,'Scotland fixtures']].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
 const next=scot.find(f=>new Date(f.date)>new Date() && !isFinished(f)); $('#nextScotlandMatch').innerHTML=next?`<b>Next up</b><br>${scoreLine(next)}<br><span>${fmt(next.date)}</span>`:'Scotland fixtures complete';
}
function renderFilters(){
 [...new Set(fixtures.map(f=>f.round))].forEach(r=>$('#roundFilter').insertAdjacentHTML('beforeend',`<option>${r}</option>`));
 Object.keys(WC_DATA.groups).forEach(g=>$('#groupFilter').insertAdjacentHTML('beforeend',`<option>${g}</option>`));
}
function filterList(){
 const q=$('#searchInput').value.toLowerCase(), r=$('#roundFilter').value, g=$('#groupFilter').value;
 return liveFixtures.filter(f=>(r==='all'||f.round===r)&&(g==='all'||f.group===g)&&JSON.stringify(f).toLowerCase().includes(q));
}
function renderFixtures(){
 $('#fixtureRows').innerHTML=filterList().map(f=>`<tr class="${[f.home,f.away].includes('Scotland')?'row-scotland':''}"><td>${fmt(f.date)}</td><td><span class="badge">${f.round}${f.group!=='Knockout'?` ${f.group}`:''}</span></td><td><b>${scoreLine(f)}</b></td><td>${f.venue}</td><td>${statusBadge(f)}</td></tr>`).join('');
}
function renderScotland(){
 $('#scotlandFixtures').innerHTML=liveFixtures.filter(f=>[f.home,f.away].includes('Scotland')).map(f=>`<article class="match-card scotland"><span class="badge">${f.group==='Knockout'?f.round:'Group '+f.group}</span><div class="teams">${scoreLine(f)}</div><p class="meta">${fmt(f.date)}<br>${f.venue}<br>${statusText(f)}</p></article>`).join('');
}
function renderGroups(){
 $('#groupTables').innerHTML=Object.entries(WC_DATA.groups).map(([g,teams])=>`<div class="group-table"><h3>Group ${g}</h3><table><thead><tr><th>Team</th><th>P</th><th>Pts</th><th>GD</th></tr></thead><tbody>${tableFor(g,teams)}</tbody></table></div>`).join('');
}
function tableFor(group, teams){
 const rows=teams.map(t=>({t,p:0,pts:0,gf:0,ga:0}));
 liveFixtures.filter(f=>f.group===group && Number.isFinite(f.homeScore) && Number.isFinite(f.awayScore) && (isFinished(f) || isLive(f))).forEach(f=>{
  const h=rows.find(x=>x.t===f.home), a=rows.find(x=>x.t===f.away); if(!h||!a)return;
  h.p++;a.p++;h.gf+=f.homeScore;h.ga+=f.awayScore;a.gf+=f.awayScore;a.ga+=f.homeScore;
  if(f.homeScore>f.awayScore)h.pts+=3; else if(f.homeScore<f.awayScore)a.pts+=3; else {h.pts++;a.pts++;}
 });
 return rows.sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.gf-a.gf).map(x=>`<tr><td>${x.t==='Scotland'?'🏴 ':''}${x.t}</td><td>${x.p}</td><td>${x.pts}</td><td>${x.gf-x.ga}</td></tr>`).join('');
}
function renderBracket(){
 const rounds=['Round of 32','Round of 16','Quarter-final','Semi-final','Final'];
 $('#bracket').innerHTML=rounds.map(r=>`<div class="round"><h3>${r}</h3>${liveFixtures.filter(f=>f.round===r).map(f=>`<div class="tie"><b>${scoreLine(f)}</b><p class="meta">${fmt(f.date)}<br>${statusText(f)}</p></div>`).join('')}</div>`).join('');
}
function renderLiveScores(){
 const now = new Date();
 const live = liveFixtures.filter(isLive);
 const upcoming = liveFixtures.filter(f=>new Date(f.date)>=now && !isLive(f) && !isFinished(f)).slice(0,8);
 const recent = liveFixtures.filter(isFinished).slice(-6).reverse();
 const list = live.length ? live : [...upcoming, ...recent].slice(0,8);
 $('#liveScores').innerHTML = list.map(f=>`<article class="live-card ${[f.home,f.away].includes('Scotland')?'scotland-live':''}"><div>${statusBadge(f)}</div><h3>${scoreLine(f)}</h3><p>${fmt(f.date)}<br>${f.venue}</p></article>`).join('') || '<p class="note">No live or upcoming matches found.</p>';
}
async function loadLiveScores(manual=false){
 if(!window.LIVE_CONFIG || !LIVE_CONFIG.enabled){ setLiveStatus('Live scores off — using local data'); return; }
 setLiveStatus(manual?'Refreshing…':'Connecting…');
 try{
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), LIVE_CONFIG.timeoutMs || 9000);
  const res = await fetch(LIVE_CONFIG.endpoint, {signal: controller.signal, cache:'no-store'});
  clearTimeout(timeout);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const updates = extractMatches(json).map(normaliseLiveMatch).filter(Boolean);
  mergeLiveUpdates(updates);
  renderStats(); renderFixtures(); renderScotland(); renderGroups(); renderBracket(); renderLiveScores();
  setLiveStatus(`Live: ${updates.length} API matches checked • ${new Date().toLocaleTimeString('en-GB')}`);
 }catch(err){
  setLiveStatus(`Using local fixture data — live API unavailable`);
 }
 clearInterval(liveTimer);
 liveTimer = setInterval(loadLiveScores, (LIVE_CONFIG.refreshSeconds || 60) * 1000);
}
function extractMatches(payload){
 if(Array.isArray(payload)) return payload;
 if(Array.isArray(payload?.data)) return payload.data;
 if(Array.isArray(payload?.matches)) return payload.matches;
 if(Array.isArray(payload?.games)) return payload.games;
 if(Array.isArray(payload?.result)) return payload.result;
 return [];
}
function normaliseLiveMatch(m){
 const home = pick(m, ['home','home_team','team1','homeTeam.name','homeTeam','home_name','homeTeamEn']);
 const away = pick(m, ['away','away_team','team2','awayTeam.name','awayTeam','away_name','awayTeamEn']);
 if(!home || !away) return null;
 const homeScore = toNum(pick(m, ['homeScore','home_score','score.home','goals.home','home_goals','team1_score']));
 const awayScore = toNum(pick(m, ['awayScore','away_score','score.away','goals.away','away_goals','team2_score']));
 return {
  home: cleanTeam(home), away: cleanTeam(away),
  homeScore, awayScore,
  status: pick(m, ['status','match_status','state','status.long','status.short']) || 'Future',
  minute: pick(m, ['minute','elapsed','time.elapsed']),
  date: pick(m, ['date','utcDate','kickoff','match_date','startTime']),
  venue: pick(m, ['venue','stadium','stadium.name'])
 };
}
function mergeLiveUpdates(updates){
 updates.forEach(u=>{
  const match = liveFixtures.find(f => sameTeam(f.home,u.home) && sameTeam(f.away,u.away)) || liveFixtures.find(f => sameTeam(f.home,u.away) && sameTeam(f.away,u.home));
  if(!match) return;
  if(Number.isFinite(u.homeScore)) match.homeScore = sameTeam(match.home,u.home) ? u.homeScore : u.awayScore;
  if(Number.isFinite(u.awayScore)) match.awayScore = sameTeam(match.away,u.away) ? u.awayScore : u.homeScore;
  match.status = u.status || match.status;
  match.minute = u.minute || match.minute;
  if(u.venue) match.venue = u.venue;
 });
}
function scoreLine(f){ return Number.isFinite(f.homeScore)&&Number.isFinite(f.awayScore) ? `${f.home} ${f.homeScore}–${f.awayScore} ${f.away}` : `${f.home} vs ${f.away}`; }
function statusText(f){ return isLive(f) && f.minute ? `LIVE • ${f.minute}'` : (f.status || 'Future'); }
function statusBadge(f){ return `<span class="badge ${isLive(f)?'live-badge':''}">${statusText(f)}</span>`; }
function isLive(f){ return /live|in.?play|1h|2h|half|et|pen/i.test(String(f.status)); }
function isFinished(f){ return /finished|full.?time|ft|aet|penalties|complete/i.test(String(f.status)); }
function setLiveStatus(txt){ $('#liveStatus').textContent = txt; }
function toNum(v){ const n = Number(v); return Number.isFinite(n) ? n : undefined; }
function cleanTeam(t){ return String(t).replace('Czech Republic','Czechia').replace('Turkiye','Turkey').replace('Türkiye','Turkey').trim(); }
function sameTeam(a,b){ return cleanTeam(a).toLowerCase() === cleanTeam(b).toLowerCase(); }
function pick(obj, paths){
 for(const path of paths){
  const val = path.split('.').reduce((o,k)=>o && o[k] !== undefined ? o[k] : undefined, obj);
  if(val !== undefined && val !== null && val !== '') return val;
 }
}
init();
