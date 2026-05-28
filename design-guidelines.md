# Design Guidelines (Draft)

> Status: rough draft. I'm still figuring out the exact look and feel, but this captures the direction I'm leaning into. Treat everything here as a working hypothesis, not a locked-in spec — open to evolving the palette, type pairing, and blur treatment as the page comes together.

Here's a direct design system extracted from the reference image I've been pulling from, focused on the **look, typography, buttons, and frosted blur treatment**.

## Overall Style

The design is minimal, editorial, and premium. It uses a very light neutral canvas, heavy contrast in text and UI chrome, and restrained decorative effects. The overall feel I'm going for is "quiet luxury + modern website landing page," with lots of whitespace and just a few strong focal points.

## Color Direction

Leaning toward a near-monochrome palette with soft white backgrounds and deep black accents.

- Background: warm off-white, not pure white. Something like `#F7F6F2` or `#FAF9F6`.
- Primary text: soft black, not harsh pure black. `#111111` or `#151515`.
- Secondary text: muted charcoal or warm gray. `#4B4B4B` to `#707070`.
- Navigation/active button: deep black fill with white text.
- Borders/dividers: very subtle black or gray at low opacity, around 8–15%.
- Blur panels: white with translucent opacity and a slight gray tint, so they feel frosted rather than cloudy.

I want to keep the palette intentionally narrow. The page should feel almost grayscale, with contrast coming from typography and spacing rather than color variety.

## Typography

Typography is going to be the main visual identity — still narrowing down the exact pairing.

- Headline serif: a refined editorial serif with high contrast and elegant curves. Thinking something close to modern fashion/editorial serif faces.
- Supporting sans-serif: clean geometric or humanist sans with soft terminals and a neutral tone.
- Body text should be light to regular weight, highly legible, and not overly wide.
- Large display sizing for the hero headline, with strong line contrast between the italic serif phrase and the sans-serif phrase.
- The serif carries emphasis, romance, and hierarchy; the sans-serif stabilizes the layout.

Pairings I'm considering:
- Serif: `Cormorant Garamond`, `Playfair Display`, `Canela-style`, or another elegant editorial serif.
- Sans: `Inter`, `Helvetica Neue`, `Satoshi`, `Avenir Next`, or a similar clean UI face.

## Heading Treatment

Main headline split into two moods:

- First line uses an italic serif for a more expressive, luxury feel.
- Second line uses a bold or semi-bold sans-serif for clarity and weight.
- Line-height tight enough that the two lines feel connected, but not cramped.
- Centered alignment for the hero area.
- Generous spacing above and below the title to keep the page airy.

Guideline I want to hold to: the serif phrase should feel like a statement, while the sans-serif phrase should feel grounded and direct.

## Buttons

Buttons should be minimal, pill-shaped, and high contrast.

### Primary button
- Shape: fully rounded pill.
- Fill: solid black.
- Text: white, centered, medium weight.
- Padding: generous horizontal padding with moderate vertical padding.
- Size: compact but prominent; it should feel like a polished action chip.
- Hover state: slightly lighten the black or raise contrast subtly.
- Active/selected nav button: same black pill style, but can be slightly smaller and integrated into the navigation row.

### Secondary button / text CTA
- Style: text-only or nearly text-only.
- Underline or dotted underline can be used for a refined editorial cue.
- Text color: black or near-black.
- No heavy borders unless very subtle.
- Keep it understated so the primary black pill remains the strongest CTA.

### Button behavior
- The page uses just one clear "apply now" action in multiple places.
- Repetition is okay, but the style should stay consistent and restrained.
- Avoid colorful buttons, gradients, shadows, or large drop shadows.

## Navigation

Navigation should be simple and centered with low visual noise.

- Nav items in one line.
- Small to medium text size, with generous letter spacing if needed.
- Active item is a black pill with white text.
- Inactive items are plain text in dark gray or black.
- Generous spacing separating nav from the top strip.
- Don't over-style the nav — the active pill is the only emphatic element.

## Frosted Blur Panels

The blur treatment should feel delicate and premium, not heavily frosted. I'm still tuning the exact opacity/blur values — open to iterating once we see it in context.

### Panel surface
- Background: white with transparency, around 65–85% opacity depending on the underlying content.
- Blur: medium blur, enough to soften background detail but not erase it.
- Add a subtle saturation boost if needed so the surface stays clean.
- Faint border to define the panel edge — like a 1px line at low opacity.

### Panel appearance
- Corners: medium to large radius, consistent with the soft pill language.
- Shadow: very soft, almost imperceptible, used only if needed to separate layers.
- Should resemble frosted glass on a very clean, bright interface.
- Keep contrast low — the blur panel should support content, not compete with it.

### Best uses
- Floating utility controls.
- Small navigation containers.
- Overlays or chips on top of imagery.
- Card-like elements that need separation without visual heaviness.

### What to avoid
- Heavy blur values that make the panel muddy.
- Dark translucent panels.
- Strong shadows or strong colored tints.
- Excessive glassmorphism layering.

## Spacing and Layout

The layout leans heavily on whitespace and centered composition.

- Large top margin and wide breathing room around the hero.
- Elements aligned to a central axis.
- Generous vertical spacing between nav, brand, headline, CTA, and imagery.
- Maintain a calm rhythm — no dense sections or cluttered grids.
- The composition should feel premium because it is sparse, not because it is decorated.

## Visual Tone

The mood I'm chasing:
- Calm.
- Aspirational.
- Modern.
- Editorial.
- Minimal.
- Slightly futuristic, but still warm and human.

The single strongest impression should be that everything is intentional and restrained.

## Practical Design Rules

- Off-white backgrounds only.
- Black as the primary accent color.
- One elegant serif and one clean sans-serif.
- Buttons pill-shaped and monochrome.
- Blur panels used sparingly — translucent and soft.
- Avoid bright colors, thick borders, loud shadows, and dense layouts.
- Prefer centered compositions with large whitespace.
- Let typography carry the brand feel.

## Component Summary

- Background: warm off-white.
- Text: black and charcoal.
- Accent: black pill buttons.
- Serif headline: elegant italic editorial style.
- Sans text: clean neutral UI font.
- Blur panels: translucent white, soft blur, subtle border, rounded corners.
- Overall feel: minimal luxury, airy, and refined.

---

_Notes to self: revisit the serif choice once the hero is in place — Playfair vs. Cormorant reads differently at display sizes. Also want to A/B the blur intensity on the nav chip vs. floating panels before locking values._
