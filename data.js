const WC_DATA = {
  sources: [
    'FIFA: World Cup 2026 match schedule, standings and knockout format',
    'UEFA: Scotland at the World Cup 2026, published 8 June 2026'
  ],
  groups: {
    A:['Mexico','South Korea','Czechia','South Africa'],
    B:['Switzerland','Canada','Qatar','Bosnia & Herzegovina'],
    C:['Brazil','Morocco','Haiti','Scotland'],
    D:['USA','Turkey','Australia','Paraguay'],
    E:['Germany','Ecuador','Ivory Coast','Curaçao'],
    F:['Netherlands','Japan','Sweden','Tunisia'],
    G:['Belgium','Egypt','Iran','New Zealand'],
    H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],
    I:['France','Senegal','Iraq','Norway'],
    J:['Argentina','Algeria','Austria','Jordan'],
    K:['Portugal','DR Congo','Uzbekistan','Colombia'],
    L:['England','Croatia','Ghana','Panama']
  },
  fixtures: [
    {date:'2026-06-11T20:00:00+01:00',round:'Group',group:'A',home:'Mexico',away:'South Africa',venue:'Mexico City Stadium',status:'Future'},
    {date:'2026-06-12T20:00:00+01:00',round:'Group',group:'B',home:'Canada',away:'Bosnia & Herzegovina',venue:'Toronto Stadium',status:'Future'},
    {date:'2026-06-13T02:00:00+01:00',round:'Group',group:'D',home:'USA',away:'Paraguay',venue:'Los Angeles Stadium',status:'Future'},
    {date:'2026-06-13T23:00:00+01:00',round:'Group',group:'C',home:'Brazil',away:'Morocco',venue:'New York New Jersey Stadium',status:'Future'},
    {date:'2026-06-14T02:00:00+01:00',round:'Group',group:'C',home:'Haiti',away:'Scotland',venue:'Boston Stadium',status:'Future'},
    {date:'2026-06-20T00:00:00+01:00',round:'Group',group:'C',home:'Scotland',away:'Morocco',venue:'Boston Stadium',status:'Future'},
    {date:'2026-06-25T00:00:00+01:00',round:'Group',group:'C',home:'Scotland',away:'Brazil',venue:'Miami Stadium',status:'Future'},
    {date:'2026-06-17T21:00:00+01:00',round:'Group',group:'L',home:'England',away:'Croatia',venue:'Dallas Stadium',status:'Future'},
    {date:'2026-06-23T20:00:00+01:00',round:'Group',group:'L',home:'England',away:'Ghana',venue:'Houston Stadium',status:'Future'},
    {date:'2026-06-27T22:00:00+01:00',round:'Group',group:'L',home:'England',away:'Panama',venue:'Toronto Stadium',status:'Future'}
  ]
};

// Fill every group with a complete round-robin skeleton where exact times are not yet entered.
const groupWindows = ['2026-06-14T20:00:00+01:00','2026-06-20T20:00:00+01:00','2026-06-25T20:00:00+01:00'];
Object.entries(WC_DATA.groups).forEach(([group, teams], idx) => {
  const pairings = [[0,1],[2,3],[0,2],[3,1],[3,0],[1,2]];
  pairings.forEach((p, i) => {
    const home = teams[p[0]], away = teams[p[1]];
    if (!WC_DATA.fixtures.some(f => f.group===group && ((f.home===home&&f.away===away)||(f.home===away&&f.away===home)))) {
      const d = new Date(groupWindows[Math.floor(i/2)]); d.setDate(d.getDate()+idx);
      WC_DATA.fixtures.push({date:d.toISOString(),round:'Group',group,home,away,venue:'TBC',status:'Future'});
    }
  });
});

['Round of 32','Round of 16','Quarter-final','Semi-final','Third-place play-off','Final'].forEach((round, r) => {
  const counts = [16,8,4,2,1,1][r];
  const starts = ['2026-06-28','2026-07-04','2026-07-09','2026-07-14','2026-07-18','2026-07-19'];
  for(let i=1;i<=counts;i++) WC_DATA.fixtures.push({date:`${starts[r]}T20:00:00+01:00`,round,group:'Knockout',home:`${round} team ${i*2-1}`,away:`${round} team ${i*2}`,venue:'TBC',status:'Future'});
});
