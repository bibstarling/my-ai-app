# v0.app Embed Mode Fix

## Problem
The app was showing "Browser Restriction Detected" warnings in v0.app preview due to Clerk authentication libraries being detected, which can fail in iframe environments due to third-party cookie restrictions.

## Solution
Implemented a comprehensive embed mode detection and handling system that:

1. **Detects iframe embedding** - Checks if the app is running inside an iframe (like v0.app preview)
2. **Conditionally disables auth** - Skips loading Clerk when in embed mode to prevent auth failures
3. **Provides fallback UI** - Shows appropriate preview indicators and fallback components

## Changes Made

### 1. Updated `ClientAuthWrapper.tsx`
- Simplified embed detection logic
- Skips `ClerkProvider` entirely when in embed mode
- Adds console log to confirm embed mode is active
- Provides `EmbedModeContext` for components to check embed status

### 2. Created `hooks/useAuthSafe.ts`
- Safe wrapper around Clerk's `useUser` hook
- Returns mock/empty auth data in embed mode to prevent errors
- Provides `isEmbedMode` flag for conditional rendering

### 3. Updated `components/AppMenu.tsx`
- Uses `useAuthSafe` instead of direct Clerk hooks
- Shows "Preview Mode" indicator instead of `UserButton` when embedded
- Gracefully handles missing auth in preview

### 4. Updated `page.tsx` (Portfolio)
- Added visual embed mode indicator at top of page
- Helps confirm the workaround is active in preview

## How to Test

### In v0.app:
1. Open your code in v0.app
2. Look for the blue banner at top: "Preview Mode - Auth disabled for iframe embedding"
3. Check browser console for: "🔍 Running in embed mode (v0 preview) - Auth disabled"
4. The page should now render without auth errors

### Locally:
1. Run `npm run dev`
2. Open in browser normally - should see full auth experience
3. No embed indicators should appear

### Testing in iframe:
```html
<iframe src="http://localhost:3000" width="100%" height="800px"></iframe>
```
Should show embed mode indicators and work without auth.

## Files Modified

- `app/ClientAuthWrapper.tsx` - Embed detection and conditional auth
- `app/hooks/useAuthSafe.ts` - NEW: Safe auth hook wrapper
- `app/components/AppMenu.tsx` - Embed-aware menu component
- `app/page.tsx` - Added embed mode indicator

## Key Features

✅ **Automatic detection** - No manual configuration needed
✅ **No code duplication** - Single source of truth for embed status
✅ **Graceful degradation** - App works in preview without breaking
✅ **Visual feedback** - Clear indicators when in embed mode
✅ **Type-safe** - Full TypeScript support with no errors

## Remove Embed Indicator (Optional)

Once you've confirmed it works, you can remove the blue banner from `app/page.tsx`:

```typescript
// Remove this block:
{isEmbed && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-xs py-1 px-4 text-center">
    Preview Mode - Auth disabled for iframe embedding
  </div>
)}
```

## Notes

- The portfolio page (main landing) doesn't use auth, so it should work perfectly in v0
- Protected pages (assistant, job search, etc.) will show preview mode indicators
- Production builds work exactly the same - no performance impact
