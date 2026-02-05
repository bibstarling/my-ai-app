# Figma AI Prompt: Bianca Starling PM Brand & Design System

## COPY THIS ENTIRE PROMPT INTO FIGMA AI

---

## Brand Context

**Designer/Product:** Bianca Starling's Portfolio & Job Application Platform
**PM Archetype:** Scrappy High-Agency Builder | Exceeding High Expectations | AI Pioneer
**Target Audience:** Recruiters, hiring managers, tech companies (startups, AI firms, growth-stage)

### Brand Personality

**Core Traits to Visualize:**
1. **Resilient & Adaptive** - Stable, reliable, enduring. Handles change gracefully.
2. **Behemoth-Scale Capable** - Substantial, confident, can handle complexity. Bold structure.
3. **Scrappy & Resourceful** - Efficient, lean, no-nonsense design. Nothing wasted.
4. **High-Agency & Confident** - Bold, action-oriented, decisive visual language
5. **Exceeding Expectations Quality** - Premium polish, refined details, elevated execution
6. **AI Pioneer & Future-Forward** - Modern, tech-forward, but not overly futuristic
7. **Ships Fast** - Clean, uncluttered, direct. Easy to scan and act on.

**Performance Level:** Exceeding High Expectations

**Brand Awards (Integrate Subtly):**
- Agility Award Q1 2025: Resilience and resourcefulness managing behemoth projects
- Curiosity Award Q2 2024: AI pioneering for practical innovation

**Brand Voice:** Confident, direct, action-oriented. "I take on behemoth projects and ship."

---

## Visual Design Translation

### PM Trait → Visual Language

**Resilient/Adaptive:**
- Stable grid system that adapts gracefully across breakpoints
- Consistent design patterns that feel reliable
- Smooth transitions and states
- Robust, enduring visual structure
- Elements that maintain integrity under different conditions

**Behemoth-Scale:**
- Generous spacing that conveys capacity
- Bold, substantial typography for key messages
- Confident use of whitespace (not cramped)
- Large, clear sections that handle complex content
- Visual weight that suggests "can handle big initiatives"
- Strong structural hierarchy

**Scrappy/Resourceful:**
- Lean, efficient layouts with no wasted space
- Purposeful use of every element
- Clean lines and clear hierarchy
- Subtle, not elaborate

**High-Agency/Confident:**
- Bold typography for key messages
- Strong contrast and clear CTAs
- Assertive color use
- Confident spacing (not timid)

**Exceeding Expectations Quality:**
- Premium subtle details (refined shadows, smooth animations)
- Polished micro-interactions
- Refined typography with perfect hierarchy
- Elevated execution on every element
- Professional finish that stands out

**AI Pioneer:**
- Modern gradient accents (subtle)
- Tech-forward but warm
- Clean geometric shapes
- Contemporary color palette

**Ships Fast:**
- Immediate visual hierarchy
- Action buttons prominent
- Scannable content blocks
- Fast cognitive load

---

## Design System Specifications

### Color Palette

**Primary Colors:**
- **Action Blue:** #0066FF (confident, tech-forward)
  - Use for: CTAs, links, primary actions
  - Meaning: "Take action, ship fast"

- **Success Green:** #00C853 (shipped products, measurable impact)
  - Use for: Metrics, success states, achievements
  - Meaning: "Delivered outcomes"

- **AI Purple:** #7C3AED (AI pioneering, innovation)
  - Use for: AI features, generation buttons, innovation badges
  - Meaning: "Future-forward, AI-first"

**Neutral Colors:**
- **Deep Charcoal:** #1A1A2E (confident, professional)
- **Cool Gray:** #64748B (supporting text)
- **Light Background:** #F8FAFC (clean, spacious)
- **White:** #FFFFFF (primary background)

**Accent/Highlight:**
- **Award Gold:** #F59E0B (awards, highlights, key achievements)
  - Use sparingly for award badges and key metrics
  - Meaning: "Recognized excellence"

- **Energy Orange:** #FF6B35 (urgency, experimentation)
  - Use for: Experimental features, beta tags, "fast" indicators
  - Meaning: "Scrappy, moves fast"

### Typography

**Font Family:** 
- Primary: Inter (san-serif) - Clean, modern, highly readable
- Monospace: JetBrains Mono (for code/technical elements)

**Type Scale:**
- **Hero/H1:** 3rem (48px), bold, tight leading (1.1)
  - Use for: Name, main page titles
  - Conveys: Confidence, presence

- **H2:** 2rem (32px), semibold
  - Use for: Section headers
  - Conveys: Clear hierarchy

- **H3:** 1.5rem (24px), semibold
  - Use for: Card titles, subsections
  - Conveys: Organization

- **Body:** 1rem (16px), regular, comfortable leading (1.6)
  - Use for: Main content
  - Conveys: Readability, ease

- **Small:** 0.875rem (14px), medium
  - Use for: Labels, metadata, secondary info
  - Conveys: Subtle information

- **Micro:** 0.75rem (12px), medium, uppercase, letter-spacing
  - Use for: Tags, badges, status labels
  - Conveys: Precision, detail

### Spacing System

**Philosophy:** Confident, generous spacing that conveys "premium" and "uncluttered"

- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Card padding: 24px (1.5rem)
- Section spacing: 96px desktop, 64px mobile
- Component gaps: 16px standard, 24px for important groupings

### Component Library

#### 1. **Award Badge** (NEW - Signature Element)
```
Design:
- Size: 48x48px icon area
- Shape: Circle or rounded square
- Trophy emoji or icon
- Award name below
- Subtle gold accent border
- Hover: Slight lift with shadow

Variations:
- Large (portfolio hero): 64x64px
- Medium (cards): 48x48px
- Small (inline): 24x24px

Usage: Hero section, experience cards, resume headers
Meaning: Peer-validated excellence
```

#### 2. **Metric Cards**
```
Design:
- White background, subtle border
- Large bold number (2xl-3xl) in brand color
- Small label below in muted text
- Optional icon top-right
- Hover: Subtle shadow lift

Layout: Grid (2x2 or 4 columns)
Conveys: Measurable impact, data-driven
```

#### 3. **CTA Buttons**

**Primary (Action Blue):**
```
- Background: #0066FF
- Text: White, semibold
- Padding: 12px 24px
- Border-radius: 8px
- Hover: Slightly darker, subtle scale
- Icon + text layout
Meaning: "Ship this action"
```

**Secondary (AI Purple):**
```
- Background: #7C3AED
- For: AI-powered features
- Icon: Sparkles
Meaning: "AI-generated magic"
```

**Tertiary (Neutral):**
```
- Background: #F1F5F9
- Text: #1A1A2E
- For: Support actions
```

#### 4. **Experience/Project Cards**
```
Design:
- White background
- 1px border (#E2E8F0)
- 24px padding
- Hover: Subtle background tint, lift shadow
- Award badges top-right if applicable
- Clear typography hierarchy
- Skill tags at bottom

Layout: Grid (responsive)
Conveys: Organized, scannable, professional
```

#### 5. **Navigation**
```
Design:
- Sidebar (desktop): 224px width
- Clean icon + label
- Active state: Accent color background (10% opacity)
- Hover: Background tint
- Sticky position

Conveys: Clear, accessible, organized
```

#### 6. **Status Badges**
```
Design:
- Pill shape
- Color-coded (green=final, gray=draft, orange=pending)
- 11px text, medium weight, uppercase
- Padding: 4px 12px
- Subtle background color

Conveys: Clear state communication
```

---

## Page-Specific Design Guidelines

### Portfolio Page (Homepage)

**Hero Section:**
```
Layout: 
- Asymmetric two-column (33% left sidebar / 67% content)
- Sticky sidebar on desktop
- Award badges prominently displayed in hero

Visual Hierarchy:
1. Name (3xl bold)
2. Title + Tagline ("Scrappy High-Agency Builder")
3. Award badges (NEW - make prominent)
4. About text
5. Metrics grid (4 cards)

Award Integration:
- Large award badges with trophy emoji
- Subtle gold accent border
- Award quotes as hover tooltips
- Position: Between title and about text
```

**Experience Cards:**
```
- Hover effect with background tint
- Award badges inline with highlights
- Skill tags with category colors
- Clear date/location hierarchy
```

### Assistant/Tools Pages

**Sidebar Navigation:**
```
- Icons: Outlined style, 20px
- Active state: Blue background (10%)
- Clear labels
- Bottom: "Back to portfolio" link
```

**Chat Interface:**
```
- Clean message bubbles
- User: Right-aligned, blue accent
- AI: Left-aligned, gray background
- Code blocks with syntax highlighting
- Loading states with subtle animation
```

### Resume Builder Pages

**Dashboard:**
```
- Header with gradient background (subtle)
- Primary CTA: Purple (AI-powered)
- Secondary CTA: Blue (manual)
- Resume cards in grid
- Status badges color-coded
```

**Editor:**
```
- Sticky header with save actions
- Section cards with icons
- Form inputs with clear labels
- Drag handles for reordering (optional)
```

### Cover Letter Pages

**Dashboard:**
```
- Similar to resume builder
- Purple accent for AI generation
- Job context in cards
- Key points as pills
```

**Editor:**
```
- Paragraph-based layout
- Clear section separation
- AI context sidebar
- Export prominent
```

---

## Design Principles

### 1. Confident Hierarchy
- Bold headlines, clear subheads
- Important info immediately visible
- CTAs stand out without screaming

### 2. Efficient Use of Space
- Every element serves a purpose
- Generous but not excessive spacing
- Compact where appropriate (tags, metadata)

### 3. Action-Oriented
- Buttons clearly labeled with verbs
- Icons communicate function
- Next steps always clear

### 4. Premium Subtle Details
- Micro-interactions (hover, focus)
- Smooth transitions (200-300ms)
- Depth through shadows (subtle)
- Polish without ornament

### 5. Scannable Content
- Clear visual hierarchy
- Consistent patterns
- Grid-based layouts
- Whitespace groups related content

---

## Component Patterns

### Card Pattern (Standard)
```css
background: white
border: 1px solid #E2E8F0
border-radius: 8px
padding: 24px
hover: {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08)
  transform: translateY(-2px)
  transition: 200ms ease
}
```

### Button Pattern (Primary CTA)
```css
background: #0066FF
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600
hover: {
  background: #0052CC
  transform: scale(1.02)
}
active: {
  transform: scale(0.98)
}
```

### Award Badge Pattern (NEW)
```css
container: {
  background: white
  border: 2px solid #F59E0B
  border-radius: 12px
  padding: 16px
}

icon: {
  size: 32px
  emoji: 🏆 or 🔬
}

title: {
  font-size: 14px
  font-weight: 600
  color: #F59E0B
}

description: {
  font-size: 12px
  color: #64748B
  max-width: 300px
}
```

---

## Brand Mood Board (Visual References)

**Inspirations:**
- **Linear:** Clean, efficient, action-oriented
- **Notion:** Calm confidence, clear hierarchy
- **Stripe:** Premium subtle details, bold typography
- **Vercel:** Modern tech-forward, clean
- **Figma:** Colorful but professional, playful confidence

**NOT Like:**
- Enterprise software (too formal)
- Consumer social (too casual)
- Crypto/Web3 (too loud)
- Traditional corporate (too stiff)

**Sweet Spot:** 
Modern tech startup meets award-winning professional. Confident without arrogant. Polished without precious.

---

## Specific UI Elements to Design

### 1. Award Showcase Component (PRIORITY)
```
Location: Portfolio hero section
Design:
- 2-column grid
- Each award: Icon + title + description
- Gold accent border (2px)
- Subtle background tint
- Compact but readable
- Desktop: Side-by-side
- Mobile: Stacked

Copy:
🏆 Agility Award Q1 2025
"Living example of resourcefulness, creative solutions, scrappy experimentation"

🔬 Curiosity Award Q2 2024
"AI pioneering on IAT project"
```

### 2. Metric Cards (Updated)
```
4-column grid:
- 25% (Engagement increase)
- 0-to-1 (ChatGPT App & AI products)
- 200% (Revenue growth)
- 500+ (Schools transformed)

Style: Clean number + small label, subtle background
```

### 3. Generate from Job Button
```
Style: Purple (#7C3AED)
Icon: Sparkles
Label: "Generate from Job"
Size: Medium-large (prominent)
Meaning: AI-powered feature
```

### 4. Navigation Sidebar
```
Width: 224px
Items: Icon (20px) + Label
Active: Accent color background (10%)
Clean, minimal, functional
```

---

## Layout Structures to MAINTAIN

### Portfolio Page
```
Desktop:
├─ Sidebar (33%, sticky)
│  ├─ Name & title
│  ├─ Awards (NEW - prominent)
│  ├─ Navigation
│  └─ Social links
└─ Content (67%, scrollable)
   ├─ About + metrics
   ├─ Experience cards
   ├─ Projects grid
   ├─ Approach
   └─ Contact

Mobile:
- Stack vertically
- Header at top
- Sections scroll
```

### Assistant/Tools Pages
```
├─ Sidebar (224px)
│  ├─ Tool nav
│  └─ Back link
└─ Main content
   ├─ Header
   ├─ Content area
   └─ Action zones
```

### Resume/Cover Letter Builder
```
- Header with breadcrumbs
- Grid of cards (dashboard)
- Form-based editor
- Preview mode (full-width)
```

**DO NOT change these layout structures. Only apply new branding (colors, typography, components).**

---

## Design System Deliverables

Please create:

### 1. Core Brand Assets
- Color palette (8-10 colors with variables)
- Typography scale (6 levels)
- Spacing scale (8 levels)
- Border radius values (3 sizes)

### 2. Component Library
- Award badge component (3 sizes)
- Metric card component
- CTA buttons (primary, secondary, tertiary)
- Experience/project card
- Status badges
- Navigation items
- Form inputs
- Modals

### 3. Page Templates (Maintain Current Layouts)
- Portfolio homepage
- Assistant/tools interface
- Resume builder dashboard
- Resume editor
- Cover letter editor

### 4. UI Patterns
- Card hover states
- Button interactions
- Form validation states
- Loading states
- Empty states

---

## Brand Attributes in Design Language

| PM Trait | Visual Expression |
|----------|------------------|
| **Scrappy** | Efficient spacing, no decoration, purposeful elements |
| **High-Agency** | Bold CTAs, confident typography, strong hierarchy |
| **Award-Winning** | Premium details, refined interactions, subtle gold accents |
| **AI Pioneer** | Modern gradients (subtle), purple for AI features |
| **Ships Fast** | Clear actions, minimal friction, direct language |
| **Resourceful** | Clean design, nothing wasted, every element earns its place |

---

## Key Design Decisions

### Colors
- **Primary action:** Blue (#0066FF) - "Ship it"
- **AI features:** Purple (#7C3AED) - "AI-powered"
- **Awards/achievements:** Gold (#F59E0B) - "Excellence"
- **Success/metrics:** Green (#00C853) - "Impact delivered"
- **Experimental:** Orange (#FF6B35) - "Fast iteration"

### Typography
- **Headlines:** Bold, tight leading - Confidence
- **Body:** Comfortable leading - Readability
- **Labels:** Uppercase, tracked - Precision
- **Metrics:** Extra bold, large - Impact

### Interactions
- **Hover:** Subtle lift + shadow (2-4px)
- **Active:** Slight scale down (0.98)
- **Transitions:** 200-300ms ease
- **Focus:** Blue ring, 2px

### Spacing
- **Sections:** Generous (96px) - Premium
- **Cards:** Comfortable (24px) - Clarity
- **Components:** Efficient (16px) - Lean
- **Dense areas:** Compact (8-12px) - Scrappy

---

## Application-Wide Patterns

### Awards Integration
**Where:** Portfolio hero, resume headers, cover letter context
**How:** Prominent but tasteful. Trophy emoji + text, gold accent border, subtle background

### Metrics Display
**Where:** Portfolio, dashboards, analytics
**How:** Large bold numbers, small labels, icon optional, grid layout

### AI Features
**Where:** Generate buttons, AI actions, smart features
**How:** Purple color, sparkles icon, "AI-powered" indicator

### Job Cards
**Where:** Job listings, selection modals
**How:** White card, hover effect, clear hierarchy, status badges

### Form Inputs
**Where:** Editors, creation forms
**How:** Clean borders, focus ring (blue), labels above, placeholders light

---

## Mood & Feeling

When someone lands on any page, they should feel:

1. **"This person knows what they're doing"** (confident design, clear hierarchy)
2. **"They ship quality products"** (polished details, premium feel)
3. **"They move fast"** (clean, uncluttered, action-oriented)
4. **"They're innovative"** (modern, AI-forward elements)
5. **"They're award-winning"** (subtle excellence signals)

**NOT:**
- Cluttered or overwhelming
- Over-designed or precious
- Corporate or stiff
- Generic or template-like
- Flashy or trying too hard

---

## Technical Notes for Figma AI

**Current Tech Stack:**
- Framework: Next.js 16, React 19
- Styling: Tailwind CSS 4
- Components: Lucide React icons
- Fonts: Inter (already loaded)

**CSS Variables in Use:**
```css
--background: #ffffff
--foreground: #1a1a2e
--muted: #64748b
--accent: #0ea5e9
--card: #f8fafc
--border: #e2e8f0
```

**Update these to match new brand colors while maintaining variable names for code compatibility.**

---

## Priority Elements

**MUST DESIGN (In Order):**

1. **Award badge component** - This is the signature brand element
2. **Updated color palette** - Match PM personality
3. **CTA button system** - Primary, AI, success variants
4. **Metric card component** - Show impact clearly
5. **Experience card** - With award integration
6. **Page headers** - Confident, clear hierarchy
7. **Navigation sidebar** - Clean, functional
8. **Form inputs** - Professional, accessible

---

## Success Criteria

The design system succeeds if:

✅ **Instantly signals:** "Award-winning PM who ships quality products"
✅ **Awards are prominent** but not overwhelming
✅ **Actions are clear** - CTAs obvious, next steps visible
✅ **Feels modern** - Tech-forward, AI-ready
✅ **Maintains layouts** - Current structures preserved
✅ **Looks premium** - Subtle polish, confident execution
✅ **Feels efficient** - Lean, purposeful, scrappy energy
✅ **Scales well** - Responsive, accessible, consistent

---

## Final Notes

**Remember:**
- This PM is **scrappy** (efficient design, no waste)
- This PM is **high-agency** (bold, confident)
- This PM is **award-winning** (premium details)
- This PM is **AI pioneer** (modern, future-forward)
- This PM **ships fast** (clear, direct, action-oriented)

**Design accordingly:** Clean confidence with a scrappy edge. Premium quality through efficient execution. Modern polish without precious details.

**The brand promise:** "I ship quality products fast with whatever resources are available."

**Visual translation:** Confident, modern, efficient design that looks premium but moves fast.

---

## Output Request

Please generate:
1. Complete design system with all components
2. Brand guidelines document
3. Updated page designs maintaining current layouts
4. Component library ready for development
5. CSS variable values for Tailwind integration

Thank you!
