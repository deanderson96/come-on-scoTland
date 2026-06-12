# Scotland 2026 — World Cup Hub

A modern-retro Scotland-focused FIFA World Cup 2026 static website.

The site is built with plain HTML, CSS and JavaScript and is ready to deploy on GitHub Pages.

## What is included

- Scotland-focused hero section
- Tournament key info
- Full fixture list
- Scotland fixture filter
- Group-stage fixture filter
- Knockout fixture filter
- All groups from A to L
- Group standings calculated from completed fixture results
- Knockout path from Round of 32 to Final
- BST kick-off times
- Mobile responsive layout
- Accessible semantic HTML
- No backend
- No build step

## File structure

```text
.
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Timezone handling

All displayed fixture times are stored and shown as **BST**.

For example:

```text
Haiti v Scotland — 14 Jun, 2:00am BST
```

The JavaScript does not rely on the visitor’s device timezone for fixture display. This avoids the issue where a UK fixture may appear one hour early for some visitors.

## Updating fixture data

Open `script.js` and edit the `FIXTURES` array.

A normal group fixture looks like this:

```js
fixture("Group C", "2026-06-14", "02:00", "Haiti", "Scotland", "Foxborough, USA")
```

A completed result looks like this:

```js
result("Group A", "2026-06-11", "20:00", "Mexico", "South Africa", "Mexico City, Mexico", "2-0")
```

A knockout fixture looks like this:

```js
knockout("Round of 32", "Match 76", "2026-06-29", "18:00", "Group C winners", "Group F runners-up", "Houston, USA")
```

## Updating group tables

Group tables are calculated automatically from completed `result(...)` entries in the `FIXTURES` array.

To update a table, update or add the relevant result:

```js
result("Group C", "2026-06-14", "02:00", "Haiti", "Scotland", "Foxborough, USA", "1-2")
```

The site automatically calculates:

```text
Played = W + D + L
Goal difference = GF - GA
Points = 3 for a win, 1 for a draw
```

The `GROUPS` array is still used as the source of the group/team list.

## Updating the last updated timestamp

Open `script.js` and change:

```js
const SITE_LAST_UPDATED = "2026-06-12T12:00:00+01:00";
```

This updates the timestamp displayed in the hero and footer.

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

### Navigation labels

Edit the navigation list in `index.html`.

### Layout

Most layout controls are in `styles.css`:

```css
.stat-grid
.fixture-list
.groups-grid
.knockout-grid
```

## Credits

Fan-made project for Scotland supporters.

Not affiliated with FIFA, UEFA or the Scottish FA.
