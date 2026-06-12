# Scotland 2026 — World Cup Hub

A modern-retro Scotland-focused FIFA World Cup 2026 static website.

The site is built with plain HTML, CSS and JavaScript and is ready to deploy on GitHub Pages.

## What is included

- Scotland-focused hero section
- Tournament key info
- API-driven fixture and result list
- Scotland fixture filter
- Group-stage fixture filter
- Knockout fixture filter
- Group tables when available from the data source
- Knockout path when available from the data source
- BST kick-off times
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
├── script.js
└── README.md
```

## Data source

The site uses TheSportsDB as the source of tournament data.

The JavaScript fetches and merges tournament data from multiple TheSportsDB endpoints so the fixture list is not limited to a single season response:

- `eventsseason.php` for World Cup 2026 season events
- `eventspastleague.php` for recently completed World Cup events
- `eventsnextleague.php` for upcoming World Cup events
- `eventsround.php` for rounds 1–12 of the 2026 World Cup season
- `lookuptable.php` for standings when available

The responses are de-duplicated in the browser using TheSportsDB event IDs first, then fixture date/time/team details.

The configuration is in `script.js`:

```js
const CONFIG = {
  baseUrl: "https://www.thesportsdb.com/api/v1/json",
  publicKey: "123",
  worldCupLeagueId: "4429",
  season: "2026",
  cacheKey: "scotland-2026-world-cup-cache-v2",
  cacheMinutes: 15,
  timeZone: "Europe/London",
  roundsToProbe: Array.from({ length: 12 }, (_, index) => index + 1)
};
```

## Request frequency

By default, the site makes fresh API requests only when:

- there is no cached tournament data in the visitor’s browser, or
- the cached data is older than 15 minutes.

A fresh refresh can make up to 16 API requests:

1. `eventsseason.php`
2. `eventspastleague.php`
3. `eventsnextleague.php`
4. `eventsround.php` for rounds 1–12
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

The script treats bare TheSportsDB timestamps as UTC before converting them to Europe/London time. During the tournament window this displays as **BST**, so a fixture timestamp of `01:00 UTC` displays as:

```text
2:00am BST
```

This prevents the Haiti v Scotland issue where a 2:00am BST kick-off could appear one hour early.

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

### Hero text

Edit the hero section in `index.html`.

### API refresh interval

Change this value in `script.js`:

```js
cacheMinutes: 15
```

### Round probing

The app currently probes rounds 1–12:

```js
roundsToProbe: Array.from({ length: 12 }, (_, index) => index + 1)
```

Increase this only if TheSportsDB starts publishing tournament events under additional numeric round values.

### Layout

Most layout controls are in `styles.css`:

```css
.stat-grid
.fixture-list
.groups-grid
.knockout-grid
```

## Credits

Football data powered by TheSportsDB.

Fan-made project for Scotland supporters.

Not affiliated with FIFA, UEFA or the Scottish FA.
