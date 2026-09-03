<p align="center">
  <img src="https://www.agent.sh/assets/speakers/logos/openMercato.svg" alt="Open Mercato" width="220">
</p>

<h1 align="center">Open Mercato Decks</h1>

<p align="center">
  Conference talks and reusable slide kits from the team building an enterprise app framework<br>
  100% with AI — no build step, no bundler, just HTML that presents itself.
</p>

---

## What's inside

Every deck is a single self-contained [Claude Design](https://claude.ai) canvas (`.dc.html`) — open it in a browser and it boots its own slide viewer, complete with keyboard navigation, a thumbnail rail, speaker notes and presenter mode.

| Deck | What it is |
| --- | --- |
| [`closing-the-agentic-loop.dc.html`](decks/closing-the-agentic-loop.dc.html) | The Agent Conf talk — how Open Mercato keeps a 1M+ line ERP codebase moving 24/7 with autonomous coding agents |
| [`open-mercato-slide-kit.dc.html`](decks/open-mercato-slide-kit.dc.html) | The reusable layout kit and design-token sheet every new deck starts from |
| [`alphalist-cto-ai-engineering-webinar/`](decks/alphalist-cto-ai-engineering-webinar/index.html) | Optional — the Alphalist CTO AI Engineering webinar deck (standalone HTML, own assets) |
| [`ai-tech-leaders-live-webinar/`](decks/ai-tech-leaders-live-webinar/index.html) | Optional — the AI Tech Leaders live webinar deck (standalone HTML, own assets) |

```
decks/     the .dc.html decks + the talk's thumbnail
shared/    deck-stage.js (viewer), image-slot.js (drop targets), support.js (runtime), assets/ (screenshots)
notes/     speaker notes and narrative drafts a deck was built from
index.html landing page listing the decks
server.js  zero-dependency static file server, used locally and on Railway
```

## Running locally

```bash
npm start
```

This serves the repo root on `http://localhost:3000` (or `$PORT`). Open `/` for the landing page, or jump straight into a deck:

- `/decks/closing-the-agentic-loop.dc.html`
- `/decks/open-mercato-slide-kit.dc.html`
- `/decks/alphalist-cto-ai-engineering-webinar/`
- `/decks/ai-tech-leaders-live-webinar/`

A deck **must** be served over HTTP — opening a `.dc.html` file directly via `file://` breaks it, since the runtime fetches its own source to compile the template and loads React from a CDN.

## Deploying to Railway

Railway detects the Node project from `package.json` and runs `npm start`, which launches `server.js` — a minimal static file server with zero dependencies. No extra configuration needed; just point a Railway service at this repo.

## Editing a deck

Slides live as sibling `<section data-label="...">` elements inside the `<x-import component-from-global-scope="deck-stage" ...>` block. Each section is one slide — inline-styled, matching the token sheet in `open-mercato-slide-kit.dc.html` (dark background `#08080A`, accent `#D8FB63`, Geist / Geist Mono type).

The slide viewer's thumbnail rail is hidden by default and peeks open on hover of the left edge — it never pins itself open or pushes the slide content over.

## Speaker notes

`notes/closing-the-agentic-loop-talk-notes.md` holds the narrative draft the deck was built from — useful when rehearsing or updating slide copy.

---

<p align="center">
  <sub>Built by <a href="https://github.com/open-mercato">Open Mercato</a> — an open-source enterprise app framework, written entirely by AI agents.</sub>
</p>
