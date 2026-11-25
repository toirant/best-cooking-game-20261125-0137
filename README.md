# Sizzle & Serve — Lunchtime Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/toirant/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137/leaderboard)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/toirant/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete, original 2D cooking game that runs offline in a desktop browser
from static files — no build step, no network requests, no libraries.

## The game

You are the only chef on shift at **Sizzle & Serve**. Tickets land on the
order board, each with a patience timer. Run the kitchen: grab ingredients
from the crates, chop lettuce and tomato on the board, grill patties until
they ding (not until they burn), stack everything on a plate, and serve it
at the window before the ticket runs out.

- **4 recipes** that unlock as the shift heats up: Garden Salad, Classic
  Burger, Cheese Melt, and the five-ingredient Big Stack.
- **3-minute shift** with a 30-second service rush, combos that pay extra,
  and 3 hearts — lose one every time an order expires.
- **Keyboard + mouse**: WASD / arrows to move, E or Space to use a station,
  or click anywhere to walk there and use the station on arrival. P pauses,
  M mutes, R restarts.
- **Synthesised sound**: chopping, sizzling, serve dings and a little
  bass-and-pluck kitchen tune — all generated with Web Audio, no audio files.
- **Title and results screens**, floating score popups, combo banners, and a
  three-star shift rating at the end.

## Play it

```sh
node serve.ts
# open http://localhost:8080 in a desktop browser
```

## Layout

- `game/` — the playable game (`index.html` + ES modules under `src/`)
  - `src/config.js` — recipes, ingredients, station layout, tuning
  - `src/state.js` — shift state, orders, scoring rules
  - `src/kitchen.js` — what each station does when you use it
  - `src/player.js` — movement, collision, click-to-walk
  - `src/render.js` — all canvas art: kitchen, food, HUD, screens
  - `src/audio.js` — synthesised sound effects and music
  - `src/input.js` — keyboard and mouse input
  - `src/shots.js` — staged scenes for the entry screenshots
  - `src/main.js` — bootstrap and game loop
- `screenshots/` — 4 real renders of the game in the browser
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Entry

Built for the [best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137)
on make.fun. License: MIT.
