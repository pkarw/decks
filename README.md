# Open Mercato Decks

Talks and reusable slide kits, built as self-contained [Claude Design](https://claude.ai) canvases (`.dc.html`). Each deck is a single HTML file that boots its own runtime — no build step, no bundler.

## What's here

```
decks/
  closing-the-agentic-loop.dc.html     Agent Conf talk — "Closing the Agentic Loop"
  open-mercato-slide-kit.dc.html       Reusable layouts + token sheet for new decks
  closing-the-agentic-loop.thumbnail.webp
shared/
  deck-stage.js                        Slide viewer: nav, thumbnail rail, keyboard/touch, presenter mode
  image-slot.js                        Drag-and-drop image placeholders used inside slides
  support.js                           Design-canvas runtime (compiles the `<x-dc>` template, boots React)
notes/
  closing-the-agentic-loop-talk-notes.md   Slide-by-slide speaker notes / story draft
index.html                             Landing page listing the decks
server.js                              Zero-dependency static file server (for Railway)
```

## Running locally

```bash
npm start
```

Serves the repo root on `http://localhost:3000` (or `$PORT`). Open `/` for the landing page, or jump straight to a deck:

- `/decks/closing-the-agentic-loop.dc.html`
- `/decks/open-mercato-slide-kit.dc.html`

A deck **must** be served over HTTP — opening a `.dc.html` file directly via `file://` breaks it, because the runtime fetches its own source to compile the `<x-dc>` template and loads React from a CDN.

## Deploying to Railway

Railway detects the Node project via `package.json` and runs `npm start`, which launches `server.js` — a minimal static file server with no dependencies. No extra configuration needed; just point a Railway service at this repo.

## Editing a deck

Slides live as sibling `<section data-label="...">` elements inside the `<x-import component-from-global-scope="deck-stage" ...>` block. Each section is one slide — inline-styled, matching the token sheet in `open-mercato-slide-kit.dc.html` (dark background `#08080A`, accent `#D8FB63`, Geist / Geist Mono type).

The slide viewer (`deck-stage.js`) includes a thumbnail rail on the left for jumping between slides. It's hidden by default and peeks open when you hover the left edge of the window — it never pins itself open or pushes the slide content over.

## Speaker notes

`notes/closing-the-agentic-loop-talk-notes.md` holds the narrative draft the deck was built from — useful when rehearsing or updating slide copy.
