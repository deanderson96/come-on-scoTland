# Scotland 2026 — World Cup Hub

A modern-retro Scotland-focused FIFA World Cup 2026 static website.

The site is built with plain HTML, CSS and JavaScript and is ready to deploy on GitHub Pages.

## What is included

- Scotland-focused hero section
- Decorative translucent player-name background
- Tournament key info
- API-driven fixture and result list
- Scotland fixture filter
- Group-stage fixture filter
- Knockout fixture filter
- Dynamic team fixture search powered by the rendered fixture list
- Group tables when available from the data source
- Knockout path when available from the data source
- Europe/London kick-off rendering for BST tournament dates
- Automatic 5-minute refresh checks while the page is visible
- Browser cache fallback if fresh API requests fail
- Concise match-status badges: `NS`, `1H`, `HT`, `2H`, `ET1H`, `ET2H`, `PEN`, `FT`
- Mobile responsive layout
- Accessible semantic HTML
- No backend
- No build step
- No manually maintained fixture arrays

## File structure

```text
.
├── index.html
├── styles.css
├── background.css
├── standings.css
├── polish.css
├── script.js
├── polish.js
└── README.md
```

## Data source

The site uses TheSportsDB as the source of tournament data.

The JavaScript fetches and merges tournament data from multiple TheSportsDB endpoints so the fixture list is not limited to a single season response:

- `eventsseason.php` for World Cup 2026 season events
- `eventspastleague.php` for recently completed World Cup events
- `eventsnextleague.php` for upcoming World Cup events
- `eventsround.php` for rounds 1–20 of the 2026 World Cup season
- `lookuptable.php` for standings when available

The responses are de-duplicated in the browser using TheSportsDB event IDs first, then fixture date/time/team details.

The main configuration is in `script.js`, with production polish overrides in `polish.js`. The live site currently bumps the browser cache key in `polish.js`:

```js
CONFIG.cacheKey = "scotland-2026-world-cup-cache-v16";
```

Core API defaults remain in `script.js`:

```js
const CONFIG = {
  baseUrl: "https://www.thesportsdb.com/api/v1/json",
  publicKey: "123",
  worldCupLeagueId: "4429",
  season: "2026",
  cacheMinutes: 5,
  refreshMinutes: 5,
  timeoutMs: 10000,
  timeZone: "Europe/London",
  roundsToProbe: Array.from({ length: 20 }, (_, index) => index + 1),
  groupNames: Array.from({ length: 12 }, (_, index) => `Group ${String.fromCharCode(65 + index)}`)
};
```

## Request frequency

The site checks for fresh data automatically:

- when a visitor opens the page,
- every 5 minutes while the page remains open and visible,
- when the tab becomes visible again, and
- when the browser comes back online.

Fresh API requests are made only when:

- there is no cached tournament data in the visitor’s browser, or
- the cached data is 5 minutes old or older.

A fresh refresh can make up to 24 API requests:

1. `eventsseason.php`
2. `eventspastleague.php`
3. `eventsnextleague.php`
4. `eventsround.php` for rounds 1–20
5. `lookuptable.php`

If a fresh request fails, the site uses the most recent successful cached response from the visitor’s browser.

## API key

The included public TheSportsDB v1 key is:

```js
publicKey: "123"
```

If you have your own key, replace it in `script.js`.

Because this is a static GitHub Pages site, anything in `script.js` is visible in browser requests. Do not put private server-only secrets in this project.

## Timezone handling

All displayed fixture times are rendered in **Europe/London** time.

The script treats bare TheSportsDB timestamps as UTC before converting them to Europe/London time. During the tournament window, Europe/London displays as **BST**.

No manual display offset is currently applied.

## Match status handling

The app displays one concise status badge for each match:

| Badge | Meaning |
| --- | --- |
| `NS` | Not started |
| `1H` | First half |
| `HT` | Half time |
| `2H` | Second half |
| `ET1H` | Extra-time first half |
| `ET2H` | Extra-time second half |
| `PEN` | Penalty shootout |
| `FT` | Full time / finished |

TheSportsDB status and progress fields are normalised into those badge values in `polish.js`.

If a match has a score but no explicit finished status, it is treated as `FT` unless the fixture is still inside the live kick-off window.

## Team fixture search

The fixture toolbar includes a team search field for All fixtures, Group stage and Knockout views. It builds suggestions from rendered fixture cards, then hides or shows fixture cards based on the selected or typed team name.

The search is hidden and cleared in the Scotland view, because the Scotland filter already shows Scotland fixtures only.

## Last updated

The visible “Last updated” timestamp is generated from the most recent successful data fetch.

You do not need to manually update a timestamp.

## Deploying to GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Save.

GitHub will publish the site at a URL like:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

## Local preview

You can open `index.html` directly in a browser.

For a better local preview, run a small local server.

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Customisation

### Colours

Edit the CSS variables at the top of `styles.css`.

```css
:root {
  --navy-950: #030b1d;
  --navy-900: #071a3d;
  --sky-300: #8dd8ff;
}
```

### Hero text and player-name scramble

Edit the hero section in `index.html`.

The decorative player-name layer is the `.player-name-scramble` block inside the hero. It is visual-only and marked `aria-hidden="true"`.

### API refresh interval

Change these values in `script.js`:

```js
cacheMinutes: 5,
refreshMinutes: 5
```

`cacheMinutes` controls when cached data expires. `refreshMinutes` controls how often the open page checks for fresh data.

### Round probing

The app currently probes rounds 1–20:

```js
roundsToProbe: Array.from({ length: 20 }, (_, index) => index + 1)
```

Increase this only if TheSportsDB starts publishing tournament events under additional numeric round values.

### Layout

Core layout controls are split across:

```text
styles.css       Main layout, hero, cards, fixtures, footer
background.css   Decorative hero name scramble
standings.css    Compact standings tables and Saltire header mark
polish.css       Interaction polish, status badges and finishing touches
script.js        API client, rendering and data processing
polish.js        Production behaviour overrides and match-status refinements
```

## Credits

Football data powered by TheSportsDB.

Fan-made project for Scotland supporters.

Not affiliated with FIFA, UEFA or the Scottish FA.
