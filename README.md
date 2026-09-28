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
