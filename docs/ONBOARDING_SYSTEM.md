# Onboarding & Tour System

A comprehensive guided tour system with three types of tours:
1. **Interactive Onboarding** - Step-by-step guided tour with page navigation and element highlighting
2. **Quick Overview** - Modal-based summary of key features
3. **Page-Specific Tours** - Contextual help for individual features

## Interactive Onboarding (NEW!)

The interactive onboarding provides a hands-on, step-by-step walkthrough that:
- **Navigates between pages** automatically
- **Highlights UI elements** with spotlight effect and tooltip
- **Persists progress** across page navigation using sessionStorage
- **Guides users** through 16 steps covering all major features

### Features

- **Spotlight Effect**: Dark overlay with cutout highlighting target element
- **Animated Border**: Pulsing border around highlighted element
- **Smart Positioning**: Tooltip automatically positions to avoid viewport edges
- **Progress Tracking**: Visual progress bar and step indicators
- **Cross-Page Navigation**: Seamlessly moves between pages during tour
- **Element Detection**: Waits for elements to load before highlighting

### User Experience

1. User opens app for the first time or clicks "Take a Tour"
2. Modal appears with choice: "Interactive Tour" or "Quick Overview"
3. If interactive selected:
   - Tour navigates to dashboard
   - Highlights specific UI elements (menu items, buttons, inputs)
   - Shows tooltip with title, description, and navigation
   - Automatically navigates to next page when user clicks "Next"
   - Maintains tour state even when page refreshes

### Technical Implementation

#### Components

**TourSpotlight.tsx**
- Creates the spotlight overlay effect
- Positions tooltip near target element
- Handles element detection and scrolling
- Responsive positioning to stay within viewport

**InteractiveOnboarding.tsx**
- Manages tour state and navigation
- Stores progress in sessionStorage
- Detects page changes and shows appropriate step
- Handles tour completion

**interactive-tour-steps.tsx**
- Defines all 16 tour steps
- Specifies page URL and CSS selector for each step
- Includes title, description, and positioning

### Tour Steps

The tour follows the natural user workflow:

1. **Welcome** - Introduction modal (center)
2. **Dashboard Overview** - Shows the dashboard (center)
3. **Sidebar Menu** - Highlights navigation menu (right)
4. **Find Jobs Nav** - Job search menu item - START HERE (right)
5. **Job Search Page** - Search input for finding jobs (bottom)
6. **My Applications Nav** - Application tracking menu item (right)
7. **Profile Nav** - Profile/portfolio menu item (right)
8. **Profile Builder** - Chat/input for building profile (top)
9. **Profile Modes** - Editing mode switcher (bottom)
10. **Resume Nav** - Resume builder menu item (right)
11. **Resume Builder** - Create resume button (bottom)
12. **Cover Letter Nav** - Cover letter menu item (right)
13. **Cover Letter Builder** - Create cover letter button (bottom)
14. **AI Coach Nav** - AI coach menu item (right)
15. **AI Coach Chat** - Chat input for career advice (top)
16. **User Menu** - Settings and account menu (left)
17. **Complete** - Completion message (center)

### Starting the Interactive Tour

```typescript
import { startInteractiveTour } from '@/app/components/InteractiveOnboarding';

// Start the tour
startInteractiveTour();
```

This:
1. Creates tour state in sessionStorage
2. Navigates to first step's page
3. Shows spotlight on target element
4. User clicks "Next" to progress

### CSS Selectors Used

Tour relies on stable CSS selectors:
- Navigation: `a[href="/portfolio/builder"]`
- Buttons: `button:has-text("Generate")`
- Inputs: `input[placeholder*="message"]`
- User menu: `.cl-userButtonTrigger`

**Important**: Maintain these selectors in UI code for tour to work.

### Customizing Steps

Edit `lib/interactive-tour-steps.tsx`:

```typescript
export const interactiveOnboardingSteps: InteractiveTourStep[] = [
  {
    id: 'unique-id',
    page: '/your-page',
    targetSelector: '.your-element', // or null for center modal
    title: 'Step Title',
    description: 'What to do here',
    position: 'bottom', // top, bottom, left, right, center
    waitForElement: true,
    action: 'navigate', // or 'none'
  },
];
```

---

## Quick Overview

Modal-based tour for users who prefer self-paced exploration.

## Page-Specific Tours

Each major page has a dedicated help button (?) with tooltip that launches a guided tour specific to that page's features.

### Available Page Tours

- **Portfolio Builder** - 5 steps covering chat, upload, preview, and publish
- **Resume Builder** - 5 steps covering generation, adaptation, editing, and export
- **Cover Letters** - 4 steps covering generation, customization, and export
- **Job Search** - 4 steps covering search, matching, and tracking
- **My Applications** - 3 steps covering status tracking and documents
- **AI Career Coach** - 3 steps covering the AI assistant features
- **Dashboard** - 3 steps covering overview and quick actions

### Help Button Features

- **Fixed Position**: Bottom-right corner, always accessible
- **Animated**: Pulse effect and shine on hover
- **Tooltip**: "Take a guided tour of this page" on hover
- **Brand Colors**: Gradient from Terra Cotta to Ocean Blue
- **Responsive**: Works on all screen sizes

### Customization

Edit tours in `lib/page-tours.tsx`:

```typescript
export const pageTours: Record<string, { title: string; steps: TourStep[] }> = {
  'your-page-id': {
    title: 'Your Page Tour',
    steps: [
      {
        id: 'step-1',
        title: 'Step Title',
        description: 'Step description',
        icon: <Icon className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Tip 1',
          'Tip 2',
        ],
      },
    ],
  },
};
```

Add to any page:

```typescript
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';

export default function YourPage() {
  const [showPageTour, setShowPageTour] = useState(false);
  const pageTour = getPageTour('your-page-id');

  return (
    <div>
      {/* Your page content */}
      
      <HelpButton onClick={() => setShowPageTour(true)} />
      {pageTour && (
        <PageTour
          isOpen={showPageTour}
          onClose={() => setShowPageTour(false)}
          steps={pageTour.steps}
          title={pageTour.title}
        />
      )}
    </div>
  );
}
```

Modal dialog that shows 6 feature overviews without page navigation. Users can:
- Read about each feature
- Navigate with previous/next
- Skip to any step
- Quick actions to visit features

---

## User Choice System

When onboarding launches, users see a choice screen:

### Interactive Tour (Recommended)
- ⏱️ ~3 minutes
- 🎯 Hands-on experience
- 📍 16 guided steps
- Navigates through actual pages
- Highlights UI elements

### Quick Overview
- ⚡ ~1 minute  
- 📖 Self-paced reading
- 📝 6 feature summaries
- Modal-based
- Quick actions to features

## Features

### 🎯 Interactive Tour
- **6-step guided tour** through all major features
- Beautiful modal interface with progress tracking
- Step indicators and navigation controls
- Skip or go back at any time

### 🎨 Visual Design
- Gradient headers with brand colors (#e07a5f to #3b82f6)
- Icon-based step identification
- Feature highlights with checkmarks
- Smooth transitions and animations
- Responsive design

### 🚀 Auto-Launch for New Users
- Automatically launches on first login
- Only shows once per session (uses sessionStorage)
- Tracks completion in database
- Respects user preferences

### 🔄 Relaunchable
- Available anytime from user menu
- "Take a Tour" option in UserButton dropdown
- Allows users to revisit features

## Tour Steps

1. **Welcome** - Introduction to Applause platform
2. **Portfolio Builder** - AI-powered portfolio creation
3. **Smart Resume Builder** - Job-specific resume generation
4. **Cover Letter Generator** - Compelling cover letter creation
5. **Job Search** - Multi-source job aggregation
6. **AI Career Coach** - Personal AI assistant

Each step includes:
- Clear title and description
- Feature highlights
- Quick action button to navigate to feature
- Visual icon representation

## Technical Implementation

### Components

#### `OnboardingTour.tsx`
Main onboarding modal component with:
- Modal dialog using @headlessui/react
- Step-by-step navigation
- Progress tracking
- API integration to mark completion
- Auto-routing to features

#### `useOnboarding.ts`
Custom hook that:
- Checks user's onboarding status from API
- Auto-launches tour for new users (once per session)
- Provides state management for tour visibility
- Handles completion tracking

### API Endpoints

#### `GET /api/users/settings`
Returns user settings including:
```json
{
  "settings": {
    "content_language": "en",
    "onboarding_completed": false
  }
}
```

#### `PATCH /api/users/settings`
Updates user settings:
```json
{
  "onboarding_completed": true
}
```

Automatically sets `onboarding_completed_at` timestamp when marked complete.

### Database Schema

Migration: `20260206_add_onboarding_status.sql`

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
```

**Fields:**
- `onboarding_completed` - Boolean flag for completion status
- `onboarding_completed_at` - Timestamp when user completed onboarding

## User Flows

### First-Time User
1. User logs in for first time
2. After 1 second delay, onboarding modal auto-launches
3. User sees choice: Interactive Tour or Quick Overview
4. **If Interactive**: 
   - Navigates through 16 steps across pages
   - Highlights elements with spotlight
   - Progress persists in sessionStorage
5. **If Quick Overview**:
   - Reads 6 feature summaries in modal
   - Can skip or navigate freely
6. Completion status saved to database
7. Won't auto-launch again

### Returning User
1. User can access "Take a Tour" from user menu anytime
2. Choice modal appears
3. Can select either tour type
4. Tour starts fresh each time
5. Completion status remains marked

### Tour in Progress
- **Interactive**: Page navigation tracked in sessionStorage
- Closing browser clears progress
- Can skip anytime
- Can't go back once on new page (by design)

## Integration Points

### AppLayout.tsx
- Integrates `useOnboarding` hook
- Renders global `OnboardingTour` component
- Auto-launches for new users

### AppMenu.tsx
- Adds "Take a Tour" to UserButton menu items
- Uses Sparkles icon for visual appeal
- Positioned above Help Center

## Customization

### Adding New Steps
Edit `steps` array in `OnboardingTour.tsx`:

```typescript
{
  id: 'new-feature',
  title: '🆕 New Feature',
  description: 'Description of the new feature',
  icon: <Icon className="w-12 h-12 text-[#e07a5f]" />,
  action: {
    label: 'Try New Feature',
    href: '/new-feature',
  },
  features: [
    'Feature point 1',
    'Feature point 2',
  ],
}
```

### Styling
The component uses Tailwind CSS with brand colors:
- Primary: `#e07a5f` (Terra Cotta)
- Secondary: `#3b82f6` (Ocean Blue)
- Success: `#10b981` (Emerald)

### Auto-Launch Timing
Adjust delay in `useOnboarding.ts`:
```typescript
setTimeout(() => {
  setIsOnboardingOpen(true);
  sessionStorage.setItem('onboarding_prompted', 'true');
}, 1000); // Change delay here (in milliseconds)
```

## Best Practices

### When to Show Onboarding
- ✅ First-time users (automatic)
- ✅ After major feature updates (manual trigger)
- ✅ When user requests help
- ❌ Every time user logs in
- ❌ During critical workflows

### Session Storage
Uses `sessionStorage.getItem('onboarding_prompted')` to:
- Prevent multiple auto-launches in same session
- Allow manual relaunches
- Clear on browser close

### Database Tracking
- Tracks permanent completion status
- Allows analytics on onboarding completion rates
- Can be used for onboarding funnel analysis

## Future Enhancements

Potential improvements:
- [ ] Track individual step completion
- [ ] Add tooltips for UI elements (product tour style)
- [ ] Gamification with rewards for completion
- [ ] Personalized tour based on user role
- [ ] Video tutorials for each step
- [ ] Analytics integration for step drop-off rates
- [ ] A/B testing different onboarding flows
- [ ] Multi-language support
- [ ] Interactive playground mode

## Troubleshooting

### Onboarding Not Auto-Launching
1. Check database has migration applied
2. Verify user record has `onboarding_completed: false`
3. Clear sessionStorage: `sessionStorage.removeItem('onboarding_prompted')`
4. Check browser console for API errors

### Can't Relaunch Manually
1. Verify UserButton menu items are rendering
2. Check that OnboardingTour is imported in AppMenu
3. Look for JavaScript errors in console

### Styling Issues
1. Ensure Tailwind classes are not being purged
2. Check that @headlessui/react is installed
3. Verify lucide-react icons are available

## Migration Guide

To apply the onboarding schema:

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL Editor
# Run: supabase/migrations/20260206_add_onboarding_status.sql
```

## Testing

### Manual Testing Checklist
- [ ] Create new user account
- [ ] Verify onboarding auto-launches after 1 second
- [ ] Test all navigation (next, previous, dots)
- [ ] Test skip functionality
- [ ] Verify action buttons navigate correctly
- [ ] Test manual relaunch from user menu
- [ ] Verify completion is saved to database
- [ ] Test responsive design on mobile
- [ ] Test keyboard navigation (Tab, Enter, Escape)

### Reset for Testing
```javascript
// In browser console
sessionStorage.clear();

// In Supabase
UPDATE users 
SET onboarding_completed = false, 
    onboarding_completed_at = NULL 
WHERE clerk_id = 'your_clerk_id';
```

## Metrics to Track

Recommended analytics:
- Onboarding completion rate
- Average time to complete
- Step drop-off rates
- Manual relaunch frequency
- Feature adoption after onboarding
- Time to first action per feature

## Related Documentation

- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md) - Color palette and styling
- [DELIGHT_UX_GUIDE.md](./DELIGHT_UX_GUIDE.md) - User experience principles
- [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md) - Welcome email integration opportunity
