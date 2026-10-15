# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: peers, tech leads, and the wider developer community who discover or are sent Naël's interactive CV.
Job: explore craft, projects, and personality through interactive surfaces (not a dry resume page).
Secondary: recruiters / hiring managers screening for .NET / Angular roles (Bruxelles / BE); they may still contact or download the PDF, but recruitment is not the primary success frame.

## Product Purpose

A digital CV and interactive showcase for Naël Ait (Analyste développeur .NET / Angular, Bruxelles). It exists so visitors experience proof of skill and personality beyond a static PDF.
Success: engagement with the interactive surfaces and technical narrative; secondary success includes contact (mail / LinkedIn) or downloading the real CV PDF.

## Positioning

Not "a PDF on the web". Differentiation is interactive proof: persona chat (first-person Naël, fact-grounded), skill radar map, and the matrix/debugger clicker — while CV facts stay faithful to source data.
A neighboring static portfolio could copy layout; it could not truthfully claim this combination of live demos + grounded persona without the same content and behaviors.

## Operating Context

- Single-page Angular app (`ng serve` / `npm start`); French UI (`lang=fr`).
- Optional local chat API (`npm run chat` / `server/`) for the persona assistant.
- CV PDF synced into `public/cv.pdf` via `scripts/sync-cv-pdf.mjs` on start/build.
- Knowledge / retrieval corpus under `knowledge/` plus `src/app/cv.data.ts` and persona rules.

## Capabilities and Constraints

Confirmed capabilities:
- Scrollable CV sections (intro, about, experience, education, projects, skills, contact).
- Persona chat grounded in retrieved CV/knowledge (anti-hallucination rules; inventing missing facts is forbidden).
- Skill galaxy (Three.js on desktop) and mobile sonar map, plus matrix clicker as playful debugger-themed proof surfaces.
- Connect / contact affordances and downloadable PDF.

Constraints:
- Never fabricate testimonials, employers, metrics, job offers, or CV facts absent from sources.
- Identity: Naël Ait; role/stack claims must stay consistent with `cv.data` / knowledge / PDF.
- Chat must remain first-person and fact-bound; off-limits and tone rules in `persona.knowledge.ts` are product behavior, not decoration.
- Stack is incumbent Angular 22 + Three.js + Express chat server (not a greenfield stack decision).

Undecided (explicitly open):
- Whether / when to add English or full i18n.
- Formal accessibility standard beyond sensible defaults already in the UI (e.g. skip link).

## Brand Commitments

- Personal brand name: **Naël Ait** (not a separate product trademark).
- Voice: French (fr-BE), natural and concrete; debugger / `dotnet build nael.cv` personality is part of the incumbent experience voice.
- Real contact assets: email, phone, LinkedIn in `cv.data.ts`; do not invent alternate identities.

## Evidence on Hand

- `src/app/cv.data.ts` — structured CV content
- `knowledge/cv.txt`, `knowledge/tfe.txt`, `knowledge/tfe-faits.md` — chat / TFE grounding
- `public/cv.pdf` — downloadable résumé (synced)
- LinkedIn: https://www.linkedin.com/in/nael-ait
- Do **not** invent customer logos, press, testimonials, or employment claims not present above.

## Product Principles

1. Interactive proof over static résumé chrome — demos earn attention; facts stay honest.
2. Peers and craft first; hiring is welcome but secondary.
3. Grounded persona: the chat may be playful, never invent career truth.
4. One person's real identity and French voice; no fake social proof.
5. PDF and structured data remain the source of truth for claims.

## Accessibility & Inclusion

No product-mandated WCAG level beyond sensible inclusive defaults already expected of a public web CV (keyboard, reduced motion respect where present, skip link). Stronger AA commitment is an open decision, not current product law.
