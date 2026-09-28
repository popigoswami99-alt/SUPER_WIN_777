# SUPER WIN 777

SUPER WIN 777 is a mobile-first 24x7 free-play virtual-coin gaming platform.

## Advanced platform
- Automatic live-round engine and server health API
- Eight configured game experiences
- Virtual wallet, history and statistics
- Leaderboard, missions, rewards, VIP and achievements UI
- Profile and notification UI
- PWA manifest and offline service worker
- Admin dashboard
- Reusable API client
- Structured persistence schema
- Game-specific animation/configuration model

## Architecture
- index.html — player application
- server.js — HTTP/API server and round engine
- admin.html — administration dashboard
- api.js — frontend API helpers
- games-config.json — game definitions
- data/schema.json — persistence model
- manifest.webmanifest + sw.js — PWA support

## Run locally
Requires Node.js 18+.
Run: node server.js
Then open http://localhost:3000.

For public 24x7 uptime, deploy the server to an always-on host and add a persistent database and authenticated user system.

## Cash boundary
Deposit, withdrawal, cash payout, UPI and bank-transfer functionality are not implemented.


## Backend status

The platform now uses a persistent SQLite database through Node's `node:sqlite` runtime, server-authoritative virtual play processing, cookie sessions, persistent play history, derived leaderboard data, daily mission progress, notification storage, audit logging, and Server-Sent Events for live round updates.

### Run

```bash
npm start
```

Node.js 22+ is required. Set `ADMIN_TOKEN` in the server environment before using authenticated admin broadcast actions.

The project remains strictly free-play: virtual coins have no cash value and deposit, withdrawal, payout, UPI, and bank-transfer functionality remain disabled.


### Advanced platform work completed

- Distinct presentation stages for all 8 free-play games.
- Persistent virtual activity analytics endpoint and admin dashboard view.
- Lightweight API rate limiting for abuse protection.
- PWA install icon and improved metadata.
- Server-side session, wallet, play, mission, notification, audit and realtime systems.
- Automated backend architecture tests.

### Deployment

Use an always-on Node.js 22+ host with a persistent writable volume for `data/superwin.sqlite`. Configure `ADMIN_TOKEN` as a secret environment variable. Do not commit production secrets or the SQLite database file.
