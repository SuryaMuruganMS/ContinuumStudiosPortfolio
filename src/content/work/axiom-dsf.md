---
title: AxiomDSF
client: Continuum Studios
year: 2026
problem: Generated code arrives faster than any human can review it, so teams either trust it blindly or stop using it.
disciplines: [product design, front-end, systems architecture, data visualisation]
sector: Software
fidelity: live
liveUrl: https://axiomdsf.suryamuruganms40.workers.dev/#/console
featured: true
order: 3
strata:
  - id: brief
    image: /work/axiom/01-brief-new-run.webp
    note: >-
      The interesting constraint was not "make an AI write software" — that part already works.
      It was that a reviewer cannot approve what they cannot see. The product had to make a
      generated change legible to a human fast enough that reviewing it stays cheaper than
      writing it by hand.
  - id: structure
    image: /work/axiom/02-structure-agents.webp
    note: >-
      Ten agents, ten gates, one artifact chain. Each agent consumes the artifact the previous
      one produced and nothing advances until a person approves it, so the pipeline is a series
      of review checkpoints rather than a black box with a button on the front.
  - id: data
    image: /work/axiom/03-data-artifact.webp
    note: >-
      Every stage writes plain Markdown to disk, not rows in a database. That decision is what
      makes the output reviewable in a normal diff, portable out of the tool, and survivable if
      the tool is ever thrown away — the record outlives the software that produced it.
  - id: states
    image: /work/axiom/04-states-review-gate.webp
    note: >-
      A stage is approved, in review, in rework, or failed, and the interface never hides which.
      The review gate is the product; an earlier build let stages advance optimistically and the
      whole value proposition quietly disappeared with it.
  - id: motion
    image: /work/axiom/05-motion-runs.webp
    note: >-
      The trace between pipeline nodes animates only while a stage is genuinely executing. Motion
      here is a status channel, not decoration — if something is moving on screen, something is
      moving on the machine, and an operator learns to read the line at a glance.
  - id: live
    image: /work/axiom/06-live-console.webp
    note: >-
      The operator console, running against a fully mocked backend so it can be explored without
      credentials or an API key. Open a workspace and step a requirement through the line — the
      review surface is the part worth trying.
gallery:
  - src: /work/axiom/07-landing-hero.webp
    caption: >-
      The product's own front door. The routing animation is drawn to a canvas as you scroll and
      resolves into the ten-stage line the console runs on.
  - src: /work/axiom/08-stage-chain.webp
    caption: >-
      The ten stages as a chain rather than a list — each node is an agent, and the artifact
      it produces is the next one's only input.
  - src: /work/axiom/09-ten-documents.webp
    caption: >-
      What a completed run leaves behind: ten Markdown documents on disk, named for the stage
      that wrote them, readable without the tool that produced them.
  - src: /work/axiom/10-sign-in.webp
    caption: >-
      Sign-in doubles as the routing animation's resting state. The handle chosen here selects
      the workspace tree the line runs against.
  - src: /work/axiom/11-devops-bridge.webp
    caption: >-
      The Azure DevOps bridge. Credentials are held in memory for the session only and never
      written to disk — the panel says so where a user can read it.
metrics:
  - label: Agents in the pipeline, each an approval gate
    after: '10'
    source: Pipeline definition, REQ through SEC
  - label: Console transfer size, production build
    after: 183 kB
    source: Angular production build output, gzipped
  - label: Demo build, self-contained in a single file
    after: 882 kB
    source: Runs from any host or straight off the filesystem
---

## Review is the product

The easy version of this tool generates ten artifacts and shows you a spinner. We
built that first. It was useless, and it was useless for a reason worth writing down:
the bottleneck in generated software is not generation, it is trust.

So the pipeline was rebuilt around the gate rather than the generator. Every stage
stops. Every stage shows its output as a rendered document, not a blob of JSON. Every
stage offers exactly three answers — approve, rework, reject — and the run does not
move until one is given.

## What that cost

Stopping ten times is slower than stopping never, and the interface has to earn each
stop back. Most of the front-end work here is that: rendering an agent's Markdown
output at a readable measure, laying the ten stages out as one line you can read in a
glance, and keeping the approve/rework/reject controls in the same place on every
stage so the muscle memory transfers.

The console ships with a fully mocked backend as a second build, so the interface can
be evaluated on its own terms without an API key or a running server.
