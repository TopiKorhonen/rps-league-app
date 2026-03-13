# RPS League App

A full-stack TypeScript web application for exploring Rock-Paper-Scissors League match data from a legacy API.

This project was built as a take-home assignment. The app consumes a legacy API, normalises inconsistent match data, and presents it through a React frontend and a Node/Express backend.

## Features

The application supports the following:

- Viewing the latest RPS match results
- Viewing match results for a given day
- Viewing match results for a specific player
- Viewing today’s leaderboard based on number of wins
- Viewing a historical leaderboard for a selected date range

Additional improvements included in this solution:

- Defensive handling of inconsistent legacy data
- Match normalisation and winner/status calculation on the backend
- Historical query optimisations for deep cursor pagination
- In-memory caching for expensive historical requests
- Live-feed support through an SSE backend proxy
- Player-centric result display on the Results by Player page

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router

### Backend

- Node.js
- Express
- TypeScript
- Axios
- dotenv
- cors

### Development Tooling

- ts-node-development
- npm

---

## Project Structure

```text
rps-league-app/
  client/
    src/
      api/
      components/
      pages/
      types/
      App.tsx
      main.tsx
      index.css

  server/
    src/
      services/
      utils/
      types/
      index.ts
```

### Frontend structure

```pages/``` contains route-level pages such as dashboard, results by day, results by player, and leaderboard

```components/``` contains reusable UI components such as tables

```api/``` contains frontend request helpers for calling the backend

```types/``` contains shared frontend TypeScript types

### Backend structure

```index.ts``` defines the Express app and API routes

```services/``` contains data-fetching and query logic

```utils/``` contains helper functions for normalisation, winner calculation, checkpoints, and leaderboard building

```types/``` contains backend TypeScript types for raw and normalised data

---

## Architecture Overview

The app uses a small backend layer in front of the legacy API.

### Why a backend layer was used
The backend is responsible for:

- attaching the API access token securely

- normalising inconsistent legacy data

- computing match outcomes

- filtering and aggregating data for the frontend

- handling expensive historical queries

- protecting the frontend from legacy API quirks

- proxying the SSE live feed

This keeps the frontend simpler and makes the app easier to reason about.

---

## Legacy API Handling

The legacy APO provides:
- ```\history``` for cursor-paginated historical data
- ```\live``` for Server-Sent Events (SSE)

### Challenges in the legacy API

During implementation, the legacy data and API behavior required several "defensive measures":
- some move values were lowercase
- some move values were invalid
- deep historical access required many cursor-page requests
- older historical queries could be slow
- the upstream API could return ```429 Too Many Requests```

### Backend normalisation rules

To make the frontend consistent, the backend normalises moves and computes a match ```status```.

Supported statuses:

- ```WIN```
- ```TIE```
- ```INVALID```

Rules used:

- valid moves are treated case-insensitively

-valid moves are limited to ```ROCK```, ```PAPER```, and ```SCISSORS```

- if both valid moves are equal, the result is ```TIE```

- if one move is valid and the other is invalid, the valid move wins

- if both moves are invalid, the result is ```INVALID```

This logic is handled on the backend so the frontend always receives a clean and predictable shape.

---

## Historical Query Strategy

The biggest engineering challenge in this project was historical access.

Because the legacy API does not support direct date-based queries, historical requests must traverse the cursor-based ```/history``` feed page by page.

### Optimisations implemented

#### 1. Checkpoint-based start paths

Known cursor checkpoints are used to begin deep historical searches closer to the target date instead of always starting at the newest page.

#### 2. Automatic checkpoint growth

As the app crawls history, it learns additional date-to-cursor checkpoints in memory for future requests.

#### 3. Global rate limiting and retry

Requests to the legacy API are globally paced and retried with backoff when the upstream returns ```429```.

#### 4. Query result caching

Expensive historical results are cached in memory for a short time, including:

- day-based results

- date-range results

- player-filtered results

####5. Cursor page caching

Raw history pages are cached by cursor path, so overlapping historical traversals can reuse previously fetched pages instead of re-requesting the same upstream data.

### Tradeoff

Despite these optimisations, very old first-time historical queries can still be slower than recent ones. This is a direct result of the upstream API design.

The implementation favors:

- correctness

- resilience

- reasonable performance

- clear user-facing behavior

over trying to hide the limitations of the upstream system.

---

## Live Feed

The legacy API also exposes ```/live``` as an SSE stream.

This project includes a backend ```/api/live``` route that proxies the legacy SSE feed and normalizes live match events into the same match shape used elsewhere in the app.

### Why proxy the live feed through the backend

This allows the backend to:

- attach the token securely

- normalise moves

- apply the same winner/status logic

- keep the frontend data contract consistent

On the dashboard, the live feed status is shown as:

- Live connecting

- Live connected

- Live reconnecting

The dashboard is also seeded with recent historical results, so the panel is not empty before live events arrive.

--- 

## Frontend UX Decisions

The frontend was designed to be simple, readable, and easy to demo.

### Dashboard

The dashboard contains:

- a live-feed banner at the top

- a latest-results panel

- today’s leaderboard panel

The results and leaderboard panels have independent vertical scrolling so the user does not need to scroll through one section just to reach the other.

### Results by Player

The player results page uses a player-centred table. Instead of only showing the overall match winner, it explicitly shows whether the selected player:

- won

- lost

- tied

was involved in an invalid result

The page also supports optional date-range filtering, which makes the query more useful and significantly more performant.

---

## API Routes
### Health

- ```GET /api/health```

### Match results

- ```GET /api/results/latest```

- ```GET /api/results/by-day?date=YYYY-MM-DD```

- ```GET /api/results/by-player?player=name```

- ```GET /api/results/by-player?player=name&start=YYYY-MM-DD&end=YYYY-MM-DD```

### Leaderboards

- ```GET /api/leaderboard/today```

- ```GET /api/leaderboard/range?start=YYYY-MM-DD&end=YYYY-MM-DD```

### Live feed

- ```GET /api/live```

---

## Setup
### Prerequisites

- Node.js

- npm

### Backend setup

- Create a ```.env``` file in ```server/```:

```env
PORT=4000
RPS_API_TOKEN=provided_api_token
RPS_API_BASE_URL=https://assignments.reaktor.com
```

Then install dependencies and start the backend:

```bash
cd server
npm install
npm run dev
```

### Frontend setup
Install dependencies and start the frontend:

```bash
cd client
npm install
npm run dev
```

The frontend runs on Vite’s default port and calls the backend at ```http://localhost:4000```.

---

## Notes on Performance and Limitations
### Historical queries

Historical queries can still be slower on the first request when:

- the date is older

- the selected range is wide

- the player search is broad

This is expected because the upstream API is cursor-paginated and does not support direct filtering by date or player.

### Player search without dates

When no date range is provided for player results, the backend performs a recent-history search rather than promising a complete search across all historical data. Date filters are recommended for more targeted and performant queries.

### Live SSE reliability

The app includes live-feed support, but the exact behavior depends on the upstream SSE stream. The dashboard handles reconnecting states gracefully.

---

## What I Would Improve With More Time

If I had more time, I would likely add:

- persistent caching or a database-backed index for history pages

- automatic background checkpoint/index refresh

- live-updating leaderboard behavior

- summary stats on the player results page

- pagination or virtualised rendering for very large result sets

- automated tests for normalisation and historical query logic

- stronger API metadata around partial/incomplete historical searches

---

## Use of AI Tools

AI tools were used during development to help with:

- structuring the project

- discussing TypeScript/React/Node implementation choices

- reasoning about cursor-based historical query strategies

- refining the frontend

All code and design decisions were reviewed and adapted during implementation.

---

## Summary

This solution focuses on building a practical, well-structured full-stack application around a difficult legacy API.

The main areas of emphasis were:

- clear frontend presentation

- defensive backend normalisation

- pragmatic handling of deep historical queries

- thoughtful tradeoffs around performance and reliability

The result is a functional, readable, and realistic app.
