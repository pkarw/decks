
## **Title Slide**

Closing the Agentic Loop
How We Keep a 1+M-Line ERP Codebase Moving 24/7

Piotr Karwatka, founder and CTO of Open Mercato

---
## **Slide 1**

### Slide content:

- Open Mercato - is an enterprise app framework,
- "Start with 80% done" - for ERP, CRM, WMS, Manufacturing ... - cases
- Kind of Retool - but better, based on TypeScript + Next.js, MIT license,
- AI Engineering at it's Core - we built the framework 100% with LLMs, You build the apps without a single line being human written.
- 1+ M lines of code, releases every 2 weeks (300-600 PR's each), 140 contributors, 12+ core team,
- ... we try to keep it KISS with just markdowns, AGENTS.md, skills and bunch of scripts.

You typically start your journey with just a:

```markdown
npx create-mercato-app my-cool-enterprise-app
```

### Story:

Open Mercato is an Open Source Framework for building large-scale enterprise apps. Our value is simple: you get all the enterprise design patterns like RBAC, multi-tenant, i18n, data encryption, audit logs with restore PLUS business features like: fully fledged CRM,  Manufacturing, WMS, and others. You get 80% - then you use Claude or Codex to get the missing 20%, which makes this product really fit your business.

Say Retool - but way better - MIT License, TypeScript and Next.js.
We haven't written a single line of code - yet we're working on the product with 140 contributors and 12+ core team members.

Yet, we try hard to KISS (keep it stupid simple) using plain markdowns, 

It's a challenge and in this speech I'll try to uncover the most interesting parts of the AI Engineering stuff we learned in the process.

---
## **Slide 2**

### Slide content:

What I'll cover in the next couple of minutes:
- Best of fire-of-fire-and-forget at scale - autonomous coding, 
- Safety nets, code-reviews, QA automation,
- How to develop an AI harness and the skills for the unknown use-cases,
- ... what are we working on next.

### Story:
TBD

---

## Slide 3

### Slide content:

I know, you know. The basics.

I won't be telling you all the stuff about:
- coding agents,
- context management,
- skills basics, 
- SDD basics,
- workflows.

We started simple, then around 1K PR's later we realized we need the Software Factory to keep it moving.

### Story:
TBD

---

## Slide 4

### Slide content:
Keep things simple

We started simple, using AGENTS.md. Then we moved to using SDD (game changer).
Then we enabled some skills. Then more skills. Then during a single hackathon - folks opened 300 PRs a single day, and we knew we needed to go autonomous.

### Story:
TBD

--- 
## Slide 5

### Slide content:
Skills are machines in the factory

Check out the https://github.com/open-mercato/skills
We started with the interactive skills `om-code-review` and `om-spec-writting`.
Cool, but interactive  makes your dopamine system what Amphetamine makes with your macOS* 
It does not scale.

We started with the skills named `om-auto-*`: `om-auto-review-pr` - to automate the SDLC along with keeping the workflows coherent across the team.

\* - Aphetamine [project](https://apps.apple.com/us/app/amphetamine/id937984704?mt=12) to keep you, Mac, on

### Story
TBD

--- 
## Slide 6

### Slide content:

Autonomous skills

The skills `om-auto-*` goes wild:
- `om-auto-review-pr`,
- `om-auto-create-pr` - with Ralph Willigam loops,
- `om-auto-spec-writting`
- `om-auto-qa-pr` - test the PR with `agent-browser`, post-test-case, integration tests, screenshots as PR comments, including ephemeral (testcontainers) env. management for parallel runs

Fire and forget, get the next task. Repeat.

### Story:
TBD

--- 
## Slide 7

### Slide content:
Autonomous skills best practices

We go wild on working-trees and subagents.

They all use the same: Github strategy (`gh`), labeling strategy, checks - defined by the `/om-setup-agentic-pipline` skill into `agentic.config.json` + `SDLC.md` + `CODE_REVIEW.md` + `BACKWARD_COMPATIBILITY.md`

Skills are divided into references/sub-tasks and are cross-reference-free, compatible with `skills.sh`. 

These skills also auto-update docs for every AI run in the `.ai/runs` + `.ai/lessons-learned` and gather the QA artifacts for every check.

### Story:
TBD

--- 
## Slide 8 

### Slide content:
Divide and conquer with Cezar

Running these `om-auto-` skills is cool, but when you run 20 of them, parallel it's not cool anymore. 
That's why we developed `cezar`. You definitely should try it (MIT) - ultimate parallel coding orchestrator with native skills + Github support.

```markdown
npx cezar-cli
```

I use it on my VPS server + mobile to coordinate tasks all day long.
The interface I use most - due to how `om-auto-*` skills works is Github itself.

### Story:
TBD

--- 
## Slide 9

### Slide content:
Safety net

Uncle Bob Martin famously said you should not do the CR manually anymore. But you should have a safety net.

Our safety net is a GitHub CI - `build`, `lint`, `test` (about 12K unit tests), `integration` (about 3k e2e `agent-browser` tests)

Build the `ephemeral` kind of starting your app with testcontainers state management - for running parallel agents + running it over GitHub CI. Gamechanger.

### Story
TBD

--- 
## Slide 10

### Slide content:
Context management

Two contexts: for core developers, for the users of `create-mercato-app`. The ladder is key for Dx.

We started with `AGENTS.md`, then Task Router, then `module-facts` generator, `example` module, dynamic `om-framework-context`

`Axis 1`: area of ownership (architecture, data, ui) - what's to be done?
`Axis 2`: work unit - module, route, page, component, entity ...
`Axis 3`: SDLC / delivery - which skill is optimal (`om-auto-create-pr` or chaining `om-auto-create-pr` + `om-backend-ui`) 

### Story:
TBD

--- 
## Slide 11

### Slide content:
Context optimization, lower class models

We built the `context-evaluator`: 220 use cases like `I want to modify CRM, adding new field`. 

Running them on selected models (we optimized for Opus, Sol, Luna, GPT5-mini, Sonnet) - measuring: context size, loaded files, if code review succeeds, if builds, etc.

Gathering next cases using the `om-share-this-session` skill (shares artifacts + all conversation turns)

### Story:
TBD

--- 
## Slide 12

### Slide content:
What's next?

We're now working on:
- Sandboxes - VS Code + Codex + Claude in the browser for safe dev. with Cezar + skills
- OM Model 0.1 - Fine-tuned Qwen 3.7 to beat plain Luna / Sonnet (maybe Opus one day) on Open Mercato tasks!
### Story:
TBD

--- 
## Slide 13

### Slide content:
Thanks!

Check skills - https://github.com/open-mercato/skills
Check Cezar - https://github.com/open-mercato/cezar
Give us a star on Github: https://github.com/open-mercato/open-mercato

Linkedin: https://www.linkedin.com/in/piotrkarwatka
E-mail: piotr@openmercato.com 

### Story: 
TBD
