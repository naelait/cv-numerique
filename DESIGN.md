---
name: Naël Ait — CV numérique
description: Live debug session portfolio — dark IDE shell, Matrix neon signature, ember CTA
colors:
  charcoal-void: "#0c0e12"
  charcoal-deep: "#0a0d11"
  panel-ink: "#0d1117"
  code-well: "#0a0e14"
  elevated-slate: "#141820"
  field-slate: "#1a1f2a"
  warm-ink: "#ece9e2"
  muted-ink: "#a8a4b8"
  ember-signal: "#ff6a3d"
  probe-cyan: "#5ec8ff"
  matrix-green: "#7ee787"
  runtime-cyan: "#79c0ff"
  runtime-dim: "#8b949e"
  syntax-purple: "#d2a8ff"
  syntax-red: "#ff7b72"
  danger: "#f85149"
typography:
  display:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(2rem, 6.5vw, 4.2rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(1rem, 2.2vw, 1.35rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.02rem, 0.35vw + 0.95rem, 1.12rem)"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    letterSpacing: "0.04em"
rounded:
  tight: "0.2rem"
  sm: "0.25rem"
  md: "0.35rem"
  control: "0.4rem"
  panel: "0.55rem"
  pill: "999px"
spacing:
  xs: "0.35rem"
  sm: "0.75rem"
  md: "1.15rem"
  lg: "1.75rem"
  section: "clamp(1rem, 3vh, 1.75rem)"
  gutter: "clamp(1rem, 4vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.ember-signal}"
    textColor: "{colors.charcoal-void}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.15rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, #ff6a3d 88%, white)"
    textColor: "{colors.charcoal-void}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.15rem"
  runtime-btn:
    backgroundColor: "{colors.field-slate}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.md}"
    padding: "0.25rem"
    height: "44px"
  runtime-btn-accent:
    backgroundColor: "color-mix(in oklab, #7ee787 10%, #1a1f2a)"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.md}"
  hero-stamp:
    backgroundColor: "color-mix(in oklab, #ff6a3d 18%, #0c0e12)"
    textColor: "{colors.ember-signal}"
    rounded: "{rounded.sm}"
    padding: "0.35rem 0.65rem"
    typography: "{typography.label}"
  chat-suggest:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.tight}"
    padding: "0.45rem 0.55rem"
---

# Design System: Naël Ait — CV numérique

## Overview

**Creative North Star: "The Live Debug Session"**

The interface is a live IDE / runtime for a person: charcoal void canvas, call-stack chrome, traffic-light window chrome, and a footer that steps through CV sections like breakpoints. Typography pairs expressive Bricolage Grotesque with IBM Plex Sans and a hard mono layer for machine truth. The confirmed lean is Matrix neon: phosphor green and cyan glow read as signature vitality; ember orange remains the hot CTA and selection signal, not the ambient wash.

Density is information-rich but staged — deck views slide in under a fixed topbar and left rail (desktop), with soft organic easings (`--ease-organic`, `0.72s` nav). Depth is glow-first: live process states (online dots, matrix core, execute flash) carry colored bloom; resting surfaces stay mostly flat with hairline separators and tonal panel lifts.

Anti-references: generic purple SaaS gradients, cream editorial portfolios, and flat marketing card grids without runtime chrome.

**Key Characteristics:**
- Dark charcoal void + IDE panel stack
- Matrix green / probe cyan glow as live signature
- Ember accent for CTA, selection, and stamp hotspots
- Bricolage display + IBM Plex body/mono
- Sharp debugger controls (0.2–0.4rem), pills for status only
- Deck navigation with runtime footer (F5 / F10 metaphor)

## Colors

A cold near-black IDE field punched by phosphor greens, probe cyans, and a single ember hot signal.

### Primary
- **Ember Signal** (`#ff6a3d`): Primary CTA fills, hero stamp, selection background, accent borders. Scarce on chrome; loud on action.
- **Matrix Green** (`#7ee787`): Live / online / runtime accent — cursor, accent step button wash, matrix glow, chat online. Signature neon of the lean.

### Secondary
- **Probe Cyan** (`#5ec8ff`): Focus rings and attention probes.
- **Runtime Cyan** (`#79c0ff`): Secondary live process text (keycaps, links in terminal voice).

### Tertiary
- **Syntax Purple** (`#d2a8ff`) / **Syntax Red** (`#ff7b72`): Code-flavored highlights inside runtime/chat chrome — not marketing accents.
- **Danger** (`#f85149`): Errors and raid-level alerts.

### Neutral
- **Charcoal Void** (`#0c0e12`): Page background and primary surface.
- **Charcoal Deep** (`#0a0d11`) / **Code Well** (`#0a0e14`): Deeper wells and code panels.
- **Panel Ink** (`#0d1117`): Panel chrome.
- **Elevated Slate** (`#141820`) / **Field Slate** (`#1a1f2a`): Raised chrome and input fields.
- **Warm Ink** (`#ece9e2`): Primary text.
- **Muted Ink** (`#a8a4b8`): Secondary text.
- **Runtime Dim** (`#8b949e`): Dim mono labels (≥4.5:1 on void).
- **Line / Line Strong**: `color-mix` hairlines from warm ink at 14% / 28% opacity — separators, not boxes.

### Named Rules
**The Neon Is Alive Rule.** Green/cyan glow marks live process state (online, execute, matrix core). Do not paint static marketing cards with the same bloom.
**The Ember Scarcity Rule.** Ember Signal is for CTAs, stamps, and selection — keep it rare on chrome so neon green stays the ambient signature.
**The Mix-Not-Mud Rule.** Soft fills use `color-mix(in oklab, …)` against `--bg` / panels; avoid opaque gray slabs.

## Typography

**Display Font:** Bricolage Grotesque (sans-serif fallback)
**Body Font:** IBM Plex Sans (sans-serif fallback)
**Label/Mono Font:** IBM Plex Mono (monospace)

**Character:** Display is tight, heavy, slightly weird — a nameplate in a dark tool. Body is calm and readable. Mono is the machine voice: stamps, call stack, chat prompts, runtime keys.

### Hierarchy
- **Display** (800, `clamp(2rem, 6.5vw, 4.2rem)`, lh 0.98, tracking -0.045em): Hero name only.
- **Headline** (800, `clamp(1.5rem, 3.5vw, 2.4rem)`): Section `h2` in view heads.
- **Title** (600, `clamp(1rem, 2.2vw, 1.35rem)`): Role line under the name.
- **Body** (400, `clamp(1.02rem … 1.12rem)`, lh 1.55): Prose; lede max ~48–52ch.
- **Label** (mono 500–700, ~0.62–0.78rem, tracking 0.04–0.14em): Stamps, DEBUG, runtime chips, uppercase sparingly.

### Named Rules
**The Machine Voice Rule.** Anything that pretends to be a debugger, terminal, or call stack uses IBM Plex Mono — never dress it in display grotesk.
**The Nameplate Rule.** Only the hero identity uses full display scale; section titles step down to headline, not another hero.

## Layout

Desktop shell: fixed topbar, left debug rail (`--rail-width: clamp(12.5rem, 17vw, 16rem)`), stage filling the rest, runtime footer (`--footer-nav`). Stage views are a deck — one active view with slide/scale transitions — not an infinite long-scroll marketing page (scroll exists inside `stage__scroll`).

Padding rhythm: `clamp(1rem, 3vh, 1.75rem)` vertical and `clamp(1rem, 4vw, 3rem)` horizontal on stage views. About uses a two-column grid (`1fr` + `220–300px`) collapsing under 900px. Touch targets `≥44px` (`--touch-min`). Safe-area insets honored on header/footer.

At `max-width: 900px`, rail width goes to 0; footer nav grows; navigation becomes mobile chrome.

## Elevation & Depth

Glow-first hybrid. Resting surfaces are flat tonal layers (void → panel → elevated → field) separated by hairline `--line`. Structural depth for live states uses colored bloom and soft matrix shadows (e.g. core glow `0 8px 28px` green mix). Execute step flashes an inset green ring. Avoid multi-layer neutral drop shadows on ordinary cards.

### Shadow Vocabulary
- **Live bloom** (`box-shadow: 0 8px 28px color-mix(in oklab, var(--runtime-green) 22%, transparent)`): Matrix / live cores.
- **Execute flash** (inset `2px` green mix): Transient step feedback.
- **Connect ready** (soft panel shadow on `.connect--ready`): Contact panel when live — still tinted, not generic gray.

### Named Rules
**The Glow Means Live Rule.** If it glows green/cyan, something is running. Static content uses tone + line only.

## Shapes

Tight debugger geometry: `0.2–0.25rem` for stamps/chips/inputs, `0.35–0.4rem` for controls and buttons, `0.55rem` for connect/matrix shells, `999px` only for status pills and dots. Prefer 1px `--line` / `--line-strong` borders over filled card frames. Traffic-light dots are true circles.

### Named Rules
**The Pill Is Status Rule.** Full pills mark LIVE / badges — not primary buttons.

## Components

### Buttons
- **Shape:** Gently squared (`0.4rem`), min-height 44px, padding `0.75rem 1.15rem`, weight 600.
- **Primary:** Ember fill, charcoal text, ember border.
- **Hover:** Lighten ember via oklab mix; lift `translateY(-2px)` on fine pointers.
- **Ghost:** Transparent fill, warm ink; hover draws ember border + `--accent-soft` wash.
- **Runtime controls:** Field slate chips with mono keycaps; accent variant washes matrix green.

### Chips
- **Hero stamp:** Mono uppercase, ember text on `--accent-soft`, tight radius.
- **Runtime chips:** Compact mono status in the footer/rail.

### Cards / Containers
- **Corner Style:** `0.2–0.55rem` depending on panel (chat tight, connect softer).
- **Background:** Panel / field mixes, often translucent `color-mix` over void.
- **Shadow Strategy:** Glow-first when live; flat otherwise.
- **Border:** Hairline `--line`; left accent bars for warnings (ember).
- **Internal Padding:** ~`0.55–0.9rem` chrome; stage uses clamp gutters.

### Inputs / Fields
- **Style:** Field slate / elevated mixes, tight radius, mono or body depending on surface (chat composer vs. forms).
- **Focus:** `2px` probe cyan outline, offset 2–3px (`:focus-visible` global).

### Navigation
- Topbar brand (display name + mono locale), DEBUG status, mail, clock.
- Left rail: breakpoint list with green inset on active.
- Runtime footer: Step out / Continue / Step into with F-key captions.
- Mobile: rail collapses; footer carries primary nav affordances.

### Signature: Persona Chat
Terminal-window chrome (traffic lights), mono prompts in matrix green, lined message well, suggestion rows as ghost mono buttons with cyan hover. Online indicator uses matrix green bloom ring.

### Signature: Matrix Clicker / Skill Radar
Game HUD and CSS skill radar sit inside the same token world; green glow and pill HP/status are intentional Matrix lean — do not quieter them into flat marketing chrome without an explicit redesign.

## Do's and Don'ts

### Do:
- **Do** keep Charcoal Void as the default canvas and stack panels with tonal lifts + hairlines.
- **Do** reserve Matrix Green / Runtime Cyan bloom for live process states and the clicker/galaxy signatures.
- **Do** use Ember for primary CTAs, stamps, and selection — scarce elsewhere.
- **Do** pair Bricolage for nameplates/titles with IBM Plex Mono for debugger voice.
- **Do** honor `prefers-reduced-motion` / `.shell--reduced` by dropping deck and hero motion.

### Don't:
- **Don't** restyle the shell into light cream or purple-gradient SaaS.
- **Don't** put neon glow on every card — glow means live.
- **Don't** use pill radius on primary buttons.
- **Don't** invent Inter/Roboto stacks; fonts are Bricolage + IBM Plex.
- **Don't** fabricate visual proof badges or fake metrics chrome that PRODUCT.md forbids as content.
