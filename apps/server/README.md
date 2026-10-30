# RPS Rivals match server

Online matches run here: a Cloudflare Worker with one [Durable Object](https://developers.cloudflare.com/durable-objects/) per room code. Each room seats two players and runs the same `Referee` from `@rps/core` as the local game, so only the server knows both picks before the reveal. The game itself stays on GitHub Pages and connects to `wss://<worker address>/room/<CODE>`.

| File | What it does |
|---|---|
| `src/index.ts` | The Worker (routes `/room/CODE` to that room's Durable Object) and `RoomObject` (holds the two WebSockets) |
| `src/MatchRoom.ts` | The room itself: seats, fighter selection and lock-in, per-fighter rules, ready, picks, rematch, leaving, idle timeouts. No Cloudflare code, so tests drive it with a fake clock |
| `test/MatchRoom.test.ts` | Room tests (run with the rest by `npm test` at the repo root) |
| `wrangler.jsonc` | Cloudflare settings: the Worker's name (`rps-rivals-server`) and the Durable Object class |
| `../../packages/core/src/online/protocol.ts` | The messages between game and room, shared by both |

## Run it locally

```sh
npm run dev:server   # the room server on http://localhost:8787 (first run downloads Wrangler)
npm run dev          # the game; in dev it connects to localhost:8787
```

Open the game in two browser windows: CREATE ROOM in one, JOIN ROOM with the code in the other.

## Deploy

There are two Workers, one per copy of the game:

| Branch | Worker | Used by |
|---|---|---|
| `production` | `rps-rivals-server` | the live game, robinneefs.github.io/rps-rivals/ |
| `main` | `rps-rivals-server-staging` (`--env staging`) | the staging copy, robinneefs.github.io/rps-rivals/staging/ |

`.github/workflows/deploy-server.yml` deploys the matching Worker on every push to those branches that touches `apps/server/` or `packages/core/`, and can be run by hand (Actions → Deploy server → Run workflow). It needs two repository secrets, **never** committed:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID

Without them the workflow skips the deploy with a warning.

**Release the game and the Worker together.** The protocol is versioned (`PROTOCOL_VERSION`, now 4: versions 2 to 4 added fighter selection and per-fighter damage and health), and a room refuses clients on another version. Merging to `production` publishes both, but the live game will not find a match until both deploys have finished. The game finds its server through the repository **variable** (not secret) `CLOUDFLARE_WORKERS_SUBDOMAIN`, set to your workers.dev subdomain: the publish workflow (`.github/workflows/pages.yml`) builds production against `wss://rps-rivals-server.<subdomain>.workers.dev` and staging against `wss://rps-rivals-server-staging.<subdomain>.workers.dev`. Until it is set, published builds show ONLINE greyed out.

## Free plan limits

Workers Free includes SQLite-backed Durable Objects: 100,000 requests and 13,000 GB-s of run time a day, roughly 800 two-minute matches. A room closes itself if nobody joins within 10 minutes, or if nobody asks for a rematch within 2 minutes of a match ending, so abandoned rooms stop using time. Over the limit, new connections fail until midnight UTC; there is no bill on the free plan.
