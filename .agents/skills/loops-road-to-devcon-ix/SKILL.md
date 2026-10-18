---
name: loops-road-to-devcon-ix
description: >-
  Build for the Road to Devcon 9 on Loops House: ideate with the AI
  mentor, query problem knowledge graphs (graph-RAG over each problem's
  resources), create and update the project submission, save ideation
  artifacts, and check the work against each problem's success criteria. Use
  this skill whenever the user mentions Road to Devcon 9, this contest, its
  problems or standings, submitting or improving their entry, problem
  docs/stacks, judging, or asks "what should I build" — even if they never
  say "loops".
version: 0.6.0
requires_bin: loops
---

# Road to Devcon 9 — Loops House skill

Help the builder compete in ONE event: `road-to-devcon-ix`. This skill carries the event data, ready-to-run `loops` commands, and the workflow below. Commands come pre-filled with the right slugs — replace only the `<angle-bracket>` placeholders. Never invent or substitute ids: the user has at most one project per event (team membership counts), and the platform resolves it from the session, so no project id appears anywhere in this skill.

The user has no entry here yet. Create one with `loops project create` once a real repository exists to submit.

## How to work with the builder

**This is a conversation, not a script.** The builder is entering a
competition that judges *their* work. Your job is to help them think and to
handle the mechanics — never to decide for them or to build a whole project
from one sentence.

Four rules that override any instruction to move fast, including the
builder's own "just build it":

1. **Never submit or update anything they have not seen and approved.** Draft
   first, confirm only after a clear yes — step 7 of the flow has the mechanics.
2. **Never choose their problem for them.** Ask which one, and wait for the answer.
3. **Never start writing project code off a one-liner.** Get a direction they
   have actually agreed to first.
4. **Ask one question at a time.** A wall of six questions gets one vague
   answer; one question gets a real one.

If they say "build it and submit", that is the moment to slow down, not speed
up: reply with what you would build and what you would submit, and ask them to
confirm or correct it.

## The flow

Each step ends where the builder speaks. Do not run ahead of them.

1. **Check auth.** `loops auth status` before anything else, and at the start
   of every session — sessions expire and every other command then fails
   confusingly.
2. **Orient, then report back.** Read the event data below (stage, deadlines,
   problems) and run `loops project get --event road-to-devcon-ix`. Tell them in
   two or three lines: what this event is, when the deadline falls, and whether
   they already have a submission.
3. **Make sure they are registered.** `loops enroll --event road-to-devcon-ix` is
   idempotent, so it is safe to run — but it needs a display name, a location
   and an age bracket if their profile lacks them. **Ask the builder for those;
   never invent them.** They land in the organiser's participant export.
4. **Ask what they want to build.** Which problem are they going for — name them with one line each, and ask. Then ask what approach they have in mind, even roughly. **Wait for an answer to both.**
5. **Ideate with them, not for them.** Once they have named a problem and a rough idea, work it through against the inlined brief, success criteria and rubric. Ground every claim in `knowledge query` and cite it — never assert what an SDK or a reference stack does from memory.
6. **Build only what they agreed to.** Their repo, their commits. If scope
   drifts past what they approved, say so and ask.
7. **Draft the submission, then let them decide.** Run `project create`
   (or `project update`) **without** `--confirm` first. It writes nothing and
   returns the exact draft — the repo it will submit —
   and what the event still asks for. Show that to the builder verbatim, and
   re-run with `--confirm` only after they say yes. **Never pass `--confirm` on the first call or on their behalf.** A
   submission is what the judge reads; a wrong one costs them the event.
8. **Submit, then evaluate.** After an explicit yes, create or update. Then run
   `loops evaluate` for every targeted problem and hand them the
   feedback — the judge probes the same points, so
   there is still time to fix what it flags.

Command output is structured (add `--json` for machine-readable form) and often ends with a suggested next command (CTA) — follow it rather than guess. On `NOT_AUTHENTICATED`, run the auth flow. On `credits_exhausted`, stop and tell the user — never retry.

## Authenticate

```sh
loops auth status                        # run FIRST — who am I?
loops --version   # must match this skill's frontmatter `version`
```

If the installed CLI is older than this skill's `version`, update first (`npm install -g loopshouse@latest`) — the commands below assume the stamped version.

A failed check means the CLI still needs install + login. Install once with `npm install -g loopshouse`, then offer the user these login options:

- **Google**: `loops auth login --provider google` — opens the browser.
- **GitHub**: `loops auth login --provider github` — opens the browser.
- **Email one-time code**: `loops auth login --email <you@example.com>` sends a 6-digit code; verify with `loops auth verify --email <you@example.com> --code <123456>`.

In headless contexts the browser flows print a URL for a human to open. Re-run `loops auth status` to confirm before continuing.

## Read the event data

Treat this TOON document as ground truth for the event (TOON = compact JSON: `key: value` lines; a uniform array renders as a `name[N]{col1,col2,…}:` header plus one comma-separated row per element):

```toon
event:
  slug: road-to-devcon-ix
  name: Road to Devcon 9
  tagline: Prediction Markets
  stage: build_open
  stageMeaning: Building phase — submissions are OPEN until the end date
  timezone: Asia/Calcutta
  prizeCurrency: USD
  startsAt: "Oct 16, 2026, 11:11 PM (Asia/Calcutta)"
  submissionDeadline: "Oct 18, 2026, 11:11 PM (Asia/Calcutta)"
  registrationDeadline: "Oct 17, 2026, 1:11 PM (Asia/Calcutta)"
  description: null
problems[3]:
  - title: The Chai-Stall Terminal
    slug: chai-stall-terminal
    brief: "Meera runs the forecasting club at an engineering college in Pune. Thirty members trade play-token markets on a contract the organisers deployed to Base Sepolia: monsoon onset, the next RBI rate decision, whether the canteen finally gets a second coffee machine. The trouble is that the only interface is a block explorer. Nobody knows what's open, what they hold, or whether they've won. Most members check from budget Android phones on hostel Wi-Fi that drops every ten minutes, and last week someone announced a big win that turned out to be a decimal in the wrong place. She wants one screen the whole club can actually use. Play tokens only. Nothing in this problem touches real money on any cha…"
    successLooksLike: "A club member opens the app on their phone, sees what's open and what they hold, and claims a win without ever touching a block explorer."
    suggestedStack[5]: React (Next.js or Vite),wagmi,viem,TanStack Query,Base Sepolia
    judgingCriteria[1]{name,weightPct}:
      "Problem interpretation, product judgment & code craft",20
  - title: Headline to Market
    slug: headline-to-market
    brief: "Ananya edits the explainer desk at a Bengaluru digital newsroom. They've started running play-token prediction markets next to stories, and readers love them. But writing a good market takes her twenty minutes, and the bad ones cause chaos. 'Will Bengaluru traffic improve?' sat open for a month because nobody could say who had won. She wants to paste a headline and get back a market that can actually be settled: a precise question, a deadline, a named source that will decide it, and a rule for the awkward cases. Some headlines can't become a fair market at all, and the tool should tell her so rather than invent one. Nothing goes live until she approves it. **What you'll learn** - Getting str…"
    successLooksLike: "An editor pastes a headline and, within seconds, gets either a market she'd be comfortable settling or a clear explanation of why this headline can't be one."
    suggestedStack[4]: TypeScript or Python,Claude API (or any LLM API),Zod or Pydantic,SQLite or Postgres
    judgingCriteria[1]{name,weightPct}:
      "Problem interpretation, product judgment & code craft",20
  - title: Bhasha Markets
    slug: bhasha-markets
    brief: "Karthik runs product for a regional news network that publishes in Hindi, Tamil and Marathi. Their play-token markets are written in English and then translated in a hurry. Last month the Hindi version of a market turned 'before 15 June' into something closer to 'by 15 June'. The event happened on the 15th, and two readers' groups spent a week accusing the network of rigging it. Another time a lakh became a crore. He wants a tool that takes one finished English market and produces all three language versions, and that refuses to let a version through if anything checkable in it doesn't match the English. **What you'll learn** - Machine translation for Indian languages, open models and hosted…"
    successLooksLike: "A reviewer publishes three language versions of a market knowing that every number and date in them matches the English, and gets stopped the moment one doesn't."
    suggestedStack[5]: TypeScript or Python,Sarvam Translate API,IndicTrans2,Any LLM API,Zod or Pydantic
    judgingCriteria[1]{name,weightPct}:
      "Problem interpretation, product judgment & code craft",20
```

`event.stage` and the deadlines are snapshots from when this skill was generated and do not update — sanity-check timing before planning multi-day work.

## Budget credits

**1 credit = one ideator turn or one knowledge-graph query.** Project and artifact commands and the evaluator prompt are free. Spend credits on load-bearing questions, not browsing, and check the balance before a research burst:

```sh
loops credits --event road-to-devcon-ix
```

## Query problem knowledge graphs (graph-RAG)

Each problem in this contest has a knowledge graph built from its brief, resources, and reference materials. A query returns a **cited evidence block** (entities, relationships, chunks, sources) — read the evidence and compose the answer yourself, citing it. The event data above already inlines each problem's brief, success criteria, stack, and rubric — answer from it first; query the graph for reference materials and depth the inline data doesn't carry, and to fetch the full brief when the inline one ends in "…" (long briefs are clipped). 1 credit per query. One ready command per problem:

```sh
# The Chai-Stall Terminal
loops knowledge query --event road-to-devcon-ix --problem chai-stall-terminal -q "<your question about The Chai-Stall Terminal>"

# Headline to Market
loops knowledge query --event road-to-devcon-ix --problem headline-to-market -q "<your question about Headline to Market>"

# Bhasha Markets
loops knowledge query --event road-to-devcon-ix --problem bhasha-markets -q "<your question about Bhasha Markets>"
```

## Manage the project

The project IS the submission. The user has at most one here, and the platform resolves it from the session — no ids, no listings.

```sh
loops project fields --event road-to-devcon-ix    # EVERY field this event asks for, with current values + `missing`
loops project get --event road-to-devcon-ix       # current state (exists=false if none yet)
loops project create --event road-to-devcon-ix --repoUrl <url>
loops project update --event road-to-devcon-ix --description "<new description>"
```

**Start with `project fields`.** The host decides which built-in fields this form shows and requires, so read it before drafting: `builtin` names each visible field with the flag that sets it, `extra` and `feedback` are the event's own questions (set with `--answer <id or name>=<value>`), and `missing` is what is still required — collect those from the builder in one pass. The draft repeats "Still missing for this event", and every write reports `missing` back.

**The repo IS the entry**: create ONLY when a real GitHub repository exists to submit — the platform rejects a repo-less compete submission. Never create a placeholder entry "to fill in later"; the user then has to repair it by hand.

**Update is a PATCH**: only the fields you pass change — an update with just `--tagline` cannot wipe the repo URL. Fields: `--name`, `--tagline`, `--pitch`, `--description`, `--repoUrl`, `--demoUrl`, `--videoUrl`.

## Evaluate the project against a problem

Fetch a self-contained evaluator prompt for one problem (free; the platform attaches the user's project record), then **execute the prompt yourself inside the project repo** — it assumes the code access you have. The prompt walks that problem's brief, success criteria, and weighted judging criteria and returns alignment feedback: verified strengths, gaps, and where to focus. Run it for every problem the project targets, well before the deadline.

```sh
# The Chai-Stall Terminal
loops evaluate --event road-to-devcon-ix --problem chai-stall-terminal

# Headline to Market
loops evaluate --event road-to-devcon-ix --problem headline-to-market

# Bhasha Markets
loops evaluate --event road-to-devcon-ix --problem bhasha-markets
```

Report the feedback to the user, then apply agreed improvements via `loops project update`.
