---
name: Figma Brand Design
overview: Create a cohesive brand and design system in Figma AI that visually represents your PM archetype (scrappy, high-agency, award-winning, AI pioneer) and applies it across the entire application while maintaining current layout structures.
todos:
  - id: copy-prompt
    content: Copy complete prompt from FIGMA_BRAND_PROMPT.md into Figma AI
    status: pending
  - id: generate-design
    content: Let Figma AI generate component library and page designs
    status: pending
  - id: extract-tokens
    content: Extract design tokens (colors, typography, spacing) from Figma output
    status: pending
  - id: implement-system
    content: Update globals.css and create new components based on design system
    status: pending
isProject: false
---

# Figma Brand & Design System Creation

## Brand Strategy

Your PM positioning drives the visual design language:

**PM Archetype:** Scrappy High-Agency Builder | Award-Winning | AI Pioneer

**Visual Translation:**

- **Scrappy/Resourceful** → Efficient layouts, no wasted space, purposeful elements
- **High-Agency/Confident** → Bold typography, strong CTAs, confident spacing
- **Award-Winning** → Premium subtle details, refined interactions, gold accents
- **AI Pioneer** → Modern gradients, purple for AI features, tech-forward
- **Ships Fast** → Clean, uncluttered, action-oriented, scannable

## Design System Components

### New Signature Elements

**Award Badge Component (Priority)**

- 3 sizes: Large (64px), Medium (48px), Small (24px)
- Trophy emoji + title + subtle gold border
- Integrate into portfolio hero and experience cards
- Reference: [app/page.tsx](app/page.tsx) lines 755-772

**Updated Color Palette**

- Action Blue: #0066FF (primary CTAs)
- AI Purple: #7C3AED (AI features)
- Award Gold: #F59E0B (achievements)
- Success Green: #00C853 (metrics)
- Energy Orange: #FF6B35 (experimental)
- Current colors in: [app/globals.css](app/globals.css)

**Button System**

- Primary (Blue): Main actions
- AI-Powered (Purple): Generate buttons with sparkles icon
- Success (Green): Confirm/final actions
- Tertiary (Gray): Secondary actions

**Metric Cards**

- Large bold number + small label
- Optional icon, hover lift effect
- Current implementation: [app/page.tsx](app/page.tsx) lines 774-786

## Page Designs (Maintain Layouts)

### Portfolio Homepage

- Current structure: [app/page.tsx](app/page.tsx)
- Keep: 33/67 asymmetric layout, sticky sidebar
- Add: Prominent award badges between title and about text
- Enhance: Metric cards with new color system

### Assistant/Tools Pages

- Current structure: [app/assistant/page.tsx](app/assistant/page.tsx) 
- Keep: Sidebar navigation (224px), main content area
- Update: Navigation active states, CTA colors

### Resume Builder

- Current structure: [app/resume-builder/page.tsx](app/resume-builder/page.tsx)
- Keep: Card grid, dashboard layout
- Update: Purple for AI features, status badges

### Cover Letters

- Current structure: [app/cover-letters/page.tsx](app/cover-letters/page.tsx)
- Keep: Similar to resume builder
- Update: Purple accent throughout

## Implementation Workflow

### Step 1: Use Figma AI

Copy the complete prompt from [docs/FIGMA_BRAND_PROMPT.md](docs/FIGMA_BRAND_PROMPT.md) into Figma AI to generate:

1. Complete component library
2. Page designs with new branding
3. CSS variable values
4. Brand guidelines

### Step 2: Extract Design Tokens

From Figma output, extract:

- Color hex values
- Typography scale
- Spacing values
- Border radius values

### Step 3: Update Code

Apply new design system to application:

1. Update [app/globals.css](app/globals.css) with new CSS variables
2. Add award badge component
3. Update button variants
4. Implement new metric card styles
5. Apply across all pages

### Step 4: Test & Refine

- Verify layouts maintained
- Check responsive behavior
- Test interactions
- Ensure accessibility

## Key Files Reference

**Current Styling:**

- [app/globals.css](app/globals.css) - CSS variables and global styles
- [app/page.tsx](app/page.tsx) - Portfolio with current design patterns

**Generated Prompt:**

- [docs/FIGMA_BRAND_PROMPT.md](docs/FIGMA_BRAND_PROMPT.md) - Complete Figma AI prompt

**Brand Context:**

- [docs/PM_POSITIONING.md](docs/PM_POSITIONING.md) - PM archetype details
- [lib/portfolio-data.ts](lib/portfolio-data.ts) - Awards and positioning data

## Expected Outcome

A cohesive design system that:

- Visually communicates "scrappy, high-agency, award-winning PM"
- Makes awards prominent and credible
- Emphasizes action and shipped products
- Feels modern, confident, and efficient
- Maintains all current layouts
- Ready for development implementation

