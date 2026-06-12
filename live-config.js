/*
  Live score settings for GitHub Pages.
  Default uses the public open-source World Cup 2026 API documented at:
  https://github.com/rezarahiminia/worldcup2026

  To switch provider, change endpoint + provider and update normaliseLiveMatch() in app.js if needed.
  Do not put paid/private API keys here unless you are happy for them to be visible in the browser.
*/
const LIVE_CONFIG = {
  enabled: true,
  provider: 'worldcup26',
  endpoint: 'https://worldcup26.ir/get/games',
  refreshSeconds: 60,
  timeoutMs: 9000
};
