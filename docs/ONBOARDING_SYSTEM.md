# Onboarding System

A comprehensive step-by-step guided onboarding experience for new users, with the ability to relaunch anytime from the user menu.

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

## User Flow

### First-Time User
1. User logs in for first time
2. After 1 second delay, onboarding tour auto-launches
3. User completes tour or skips
4. Completion status saved to database
5. Won't auto-launch again

### Returning User
1. User can access "Take a Tour" from user menu anytime
2. Tour launches manually
3. Can review all features again
4. Completion status remains unchanged

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
