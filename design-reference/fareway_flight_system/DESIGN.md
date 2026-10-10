---
name: Fareway Flight System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d7e3fc'
  on-surface: '#101c2e'
  on-surface-variant: '#434652'
  inverse-surface: '#253144'
  inverse-on-surface: '#ecf1ff'
  outline: '#747783'
  outline-variant: '#c4c6d3'
  surface-tint: '#345baf'
  primary: '#002869'
  on-primary: '#ffffff'
  primary-container: '#0b3d91'
  on-primary-container: '#8dadff'
  inverse-primary: '#b1c5ff'
  secondary: '#00629f'
  on-secondary: '#ffffff'
  secondary-container: '#1ca1fe'
  on-secondary-container: '#00355a'
  tertiary: '#521a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#762900'
  on-tertiary-container: '#ff9162'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001947'
  on-primary-fixed-variant: '#144296'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#9bcbff'
  on-secondary-fixed: '#001d34'
  on-secondary-fixed-variant: '#004a7a'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7e2c00'
  background: '#f9f9ff'
  on-background: '#101c2e'
  surface-variant: '#d7e3fc'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  price-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  price-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.015em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the archetype of the reliable navigator: clear, confident, and delightfully efficient. It strips away the anxiety and visual clutter standard across legacy travel booking engines, replacing predatory urgency triggers with calm transparency and pristine layout architecture.

The visual style blends **Corporate Modern** rigor with **Tactile Utility**. High-contrast typography anchors data-heavy tables, while carefully modulated primary tones evoke the deep stratosphere and bright, open skies. Visual feedback is immediate, solid, and reassuring. Key decisions favor airy breathing room, structured card boundaries, and unambiguous pricing signals designed to establish instantaneous trust.

## Colors

The palette establishes an immediate atmospheric hierarchy:

- **Deep Ocean Blue (`#0B3D91`)**: Primary brand anchor. Used for primary navigation bars, solid foundational banners, table section headers, and core active states.
- **Sky Blue (`#1FA2FF`)**: Interactive accent. Drives hover states, interactive timeline markers, segment selection pills, text links, and secondary interactive controls.
- **Sunset Orange (`#FF7A3D`)**: Urgent conversion signal. Restricted strictly to terminal call-to-action buttons (e.g., "Search Flights", "Select Fare"), prominent lowest-price badges, and immediate cost highlights.
- **Dark Navy (`#0F1B2D`)**: High-contrast neutral base for primary headings, tabular values, and core content copy.
- **Slate Grey (`#64748B`)**: Secondary neutral for timestamps, airport codes, metadata tags, and non-active icons.
- **Canvas (`#F6F9FC`)**: Atmospheric tinted off-white background that prevents glare and provides natural contrast for pure white cards.
- **Border Outline (`#E2E8F0`)**: Low-contrast border color for cards, table dividers, input borders, and flight segment paths.
- **Positive / Best Fare (`#1E9E5A` on `#E8F7F0`)**: Semantic emerald for on-time performance flags, "Cheapest" indicators, and validated checkout states.

## Typography

Inter handles the entire typographic range with extreme crispness. 

- **Numeric Tabular Display**: All flight departure/arrival timestamps, layover durations, and monetary figures must explicitly enforce tabular figures (`font-feature-settings: "tnum" 1`) to eliminate visual jitter when switching dates, sorting columns, or updating fares dynamically.
- **Heading Weight Balance**: Top-level search titles and city route indicators (`headline-xl`, `headline-lg`) utilize heavy weights (700/800) with subtle negative letter-spacing for an authoritative and grounded editorial presence.
- **Flight Data Labels**: IATA airport codes (e.g., `SFO`, `LHR`) use `label-md` or `label-lg` combined with full uppercase treatment and slight tracking expansion for instant scannability on small screens.

## Layout & Spacing

The layout is constructed on an uncompromising 8-point base grid (0.5rem = 8px):

- **Grid Architecture**: 12-column responsive layout for desktop (`max-width: 1280px`), transitioning to an 8-column layout for tablets (`768px - 1024px`) and a 4-column layout below `768px`.
- **Search Console Sticky Alignment**: The multi-point search widget maintains unified desktop alignment with full-bleed gutter adaptation on mobile viewports.
- **Component Padding Scale**: Internal card paddings stay locked to 16px (`space-md`) on mobile and scale to 24px (`space-lg`) on desktop for comfortable spatial breathing around airline identity badges, routing lines, and price columns.

## Elevation & Depth

Visual hierarchy uses a refined ambient shadow system tinted with the primary hue instead of a dead-black wash, maintaining atmosphere across the off-white canvas:

- **Level 0 (Flat Canvas)**: Background at `#F6F9FC`. Inactive containers, non-interactive segment breakdowns, and recessed forms sit directly on the canvas with a 1px border (`#E2E8F0`).
- **Level 1 (Card & Flight Cell Base)**: Pure white `#FFFFFF` surface elevated by:
  `box-shadow: 0 4px 20px -2px rgba(11, 61, 145, 0.06);`
  This subtle cool-toned dispersion gives depth without visual noise.
- **Level 2 (Hover & Flight Details Expansion)**:
  `box-shadow: 0 10px 28px -4px rgba(11, 61, 145, 0.12);`
  Used when cards are focused, hovered, or expanded to show detailed layover itineraries.
- **Level 3 (Modal & Floating Price Bar)**:
  `box-shadow: 0 20px 40px -6px rgba(15, 27, 45, 0.16);`
  Reserved for date pickers, airport search auto-completes, filter overlays, and mobile sticky bottom purchase bars.

## Shapes

The design uses balanced, modern curves that soften technical density:

- **Cards & Primary Modules**: 16px corner radius (`rounded-lg` under roundedness level 2) gives flight cards and search containers a smooth, approachable frame.
- **Action Controls & Fields**: Inputs, dropdowns, and button containers use a 12px to 14px radius (`0.75rem - 0.875rem`), balancing structure with friendly curves.
- **Tags, Flight Segment Badges & Stop Indicators**: Fully pill-shaped (`9999px`) to create an immediate shape distinction between interactive tap targets and purely informative badges.

## Components

### Buttons
- **Primary / Booking CTA**: Background `#FF7A3D`, text `#FFFFFF`, font `label-md` or `label-lg`. Minimum height 48px on desktop, min-height 44px on mobile. Border-radius 12px-14px. Hover state deepens slightly to `#E86326` with a tactile 1px downward translation.
- **Secondary / Filter Actions**: Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F1B2D`. Hover shifts border to `#1FA2FF` with text `#0B3D91`.
- **Tertiary / Details Toggle**: Background transparent, text `#1FA2FF`, hover state adds an active tint of `rgba(31, 162, 255, 0.08)`.

### Cards & Flight Itinerary Items
- Pure white `#FFFFFF` background, 16px rounded corners, standard ambient cool shadow.
- Structured into three explicit zones:
  1. **Carrier & Departure/Arrival**: Airline logo, bold times, 3-letter IATA code, and city name.
  2. **Route Visualizer**: Horizontal line with a directional aircraft glyph (`#1FA2FF`), flight duration centered above, and transfer stops/layover duration marked by circular dot pips (emerald if direct, amber if multi-stop).
  3. **Price & Action Column**: Prominent `price-xl` Sunset Orange text with single-click select CTA.

### Input Fields & Search Bars
- Background `#FFFFFF`, 1px solid `#E2E8F0`, rounded 12px, 48px height minimum.
- Focus state triggers a clean 2px outline of Sky Blue (`#1FA2FF`) with a soft matching glow: `0 0 0 3px rgba(31, 162, 255, 0.15)`.
- Floating labels or paired iconography for departure, destination, date selection, and passenger count.

### Chips & Filter Pills
- Base state: `#FFFFFF` surface with `#E2E8F0` border and `#0F1B2D` text.
- Selected state: `#0B3D91` solid background with `#FFFFFF` text, or soft Sky Blue tint (`#EBF6FF`) with `#0B3D91` text and an active check icon.
- Shape: 9999px rounded pill with 8px horizontal padding and 32px standard height.

### Badges & Status Indicators
- **Cheapest Deal**: Sunset orange tint `#FFF2EB`, text `#FF7A3D`, bold uppercase styling.
- **Best / Recommended**: `#E8F7F0` soft emerald container, text `#1E9E5A`.
- **Layovers & Stops**: Neutral slate fill `#F1F5F9`, text `#64748B`.

### Checkboxes & Radio Controls
- Base control dimensions: 20px x 20px with 6px border-radius for checkboxes, circular for radio options.
- Active color: `#0B3D91` with crisp white check or center-dot indicator.
- Tap bounds: Enforced 44px hit-box minimum for comfortable mobile ergonomics.