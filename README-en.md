# ChuniArchTools · CHUNITHM Archive Tools

A lightweight, fully client‑side toolkit for CHUNITHM archive handling. No login, no server. All conversions and edits happen locally in your browser.

- Online demo: http://web.choimoe.com/chuni/
- Privacy friendly: no upload, no persistence, no access to your accounts.

## Features

- Convert RinNet archive to LXNet (CSV) scores
- Merge CSV score files
- Edit RinNet single‑track scores (judgements, status, Full Chain, etc.)

All features run in the browser and fit an offline flow: export → convert/merge/edit → download.

## Quick Start

Use the online demo, or host the static site locally:

- Option A: Online
  - Open http://web.choimoe.com/chuni/
- Option B: Local
  - Pages load HTML templates asynchronously, so use a local HTTP server:

```bash
# Using Python
python -m http.server 8000
# Then visit http://localhost:8000
```

## Architecture & Editing

The project follows a “templates + config + modules” design:

- Templates: Each page is a standalone HTML file under `assets/templates/`. Edit content in plain HTML—no JS string templates required.
- Config: Navigation and site text are defined in `assets/js/config/pages.js`. To add a page, register its id, title, and whether it shows in the nav.
- Modules: Page loading, routing, file I/O, CSV parsing, converters, and score editor are modular and isolated for easier maintenance.

Navigation uses hash routes, for example:

- Home: `#home`
- Rin → LX: `#rin-to-lx`
- CSV merge: `#merge-csv`
- Edit score: `#edit-score`

`page-loader.js` fetches the corresponding template based on the current route and emits a `pageChanged` event after rendering so feature modules can initialize.

## Adding a New Feature Page

- Create `assets/templates/your-page.html` with your page markup.
- Add a record to `assets/js/config/pages.js`:
  - `{ id: 'your-page', title: 'Your Page Title', showInNav: true }`
- For interactivity, listen to `pageChanged` in `app.js` and initialize logic when `pageId === 'your-page'`.

No HTML needs to be embedded in JavaScript; editing feels like working on a normal static page.

## Data & Security

- All parsing, conversion, and editing are performed in memory in your browser.
- No files are uploaded to any server.
- Always back up your original archives before making changes, especially if you plan to upload to third‑party services.

## Browser & Devices

- Works on modern browsers.
- Uses ES Modules and `fetch`; older browsers may require an update.

## Disclaimer

- Back up your data before any modification.
- Using edited or abnormal scores to disrupt leaderboards, present publicly, or for other improper purposes may violate platform rules. You assume all responsibility.
