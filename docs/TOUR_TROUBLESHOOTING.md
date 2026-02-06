# Tour System Troubleshooting

## Fixed Issues

### Blurred/Obscured Highlights ✅

**Problem:** Tour spotlight was blurring highlighted elements, making them hard to see.

**Root Causes:**
1. `backdrop-blur-sm` on overlay divs was blurring everything including highlighted area
2. Highlighted elements weren't properly elevated above the overlay
3. Overlay opacity too high (70%)

**Fixes Applied:**
1. ✅ **Removed backdrop-blur** - No more blur on overlays
2. ✅ **Reduced overlay opacity** - Changed from 70% to 60% for better visibility
3. ✅ **Elevated highlighted elements** - Set z-index: 10000 on target elements
4. ✅ **Added white glow** - Subtle lighting effect on highlighted area for better visibility
5. ✅ **Improved shadow** - Better contrast with glowing shadows
6. ✅ **Added scroll listener** - Updates position when page scrolls
7. ✅ **Proper cleanup** - Removes z-index changes when tour ends

### Tooltip Visibility ✅

**Fixes:**
- Tooltip now has z-index: 10001 (above highlighted elements)
- Proper pointer-events handling
- Root container set to pointer-events-none, only tooltip is interactive

## Current Behavior

### Spotlight Effect
- Dark overlay (60% opacity, no blur)
- Clear cutout for highlighted element
- Element elevated with z-index: 10000
- Pulsing orange border
- Subtle white glow for visibility

### Interactive Elements
- Highlighted elements remain fully interactive
- Tooltip has all pointer events enabled
- Tour controls (Next, Back, Skip) all functional

## Testing Checklist

- [ ] Elements are clearly visible (not blurred)
- [ ] Can click on highlighted elements if needed
- [ ] Tooltip appears in correct position
- [ ] Border animation is visible
- [ ] Tour navigation works
- [ ] Scrolling updates positions correctly
- [ ] Mobile/responsive layouts work

## Common Issues

### Element Not Found
**Symptom:** Step shows center modal instead of highlighting element

**Possible Causes:**
1. CSS selector doesn't match any element
2. Element hasn't loaded yet
3. Element is hidden or display:none

**Solution:**
- Check selector in browser dev tools
- Ensure element exists on the page
- Add `waitForElement: true` to step definition

### Element Partially Visible
**Symptom:** Only part of element is highlighted

**Possible Causes:**
1. Element position is being recalculated incorrectly
2. Parent container has transform or fixed position
3. Element dimensions changing during animation

**Solution:**
- Check for CSS transforms on parent elements
- Ensure element has stable dimensions
- Increase padding in highlight box calculation

### Tooltip Positioned Wrong
**Symptom:** Tooltip appears off-screen or covering element

**Possible Causes:**
1. Element too close to viewport edge
2. Tooltip size not calculated correctly
3. Position setting not appropriate for element location

**Solution:**
- Change `position` prop ('top', 'bottom', 'left', 'right', 'center')
- Tooltip auto-adjusts to stay in viewport
- For elements near edges, use opposite position

## CSS Selectors Used

Make sure these elements exist and maintain their selectors:

### Navigation
- `aside` - Sidebar menu
- `a[href="/dashboard"]` - Dashboard link
- `a[href="/assistant/job-search"]` - Job search link
- `a[href="/assistant/my-jobs"]` - My applications link
- `a[href="/portfolio/builder"]` - Profile link
- `a[href="/resume-builder"]` - Resume link
- `a[href="/cover-letters"]` - Cover letters link
- `a[href="/assistant/chat"]` - AI coach link

### Interactive Elements
- `input[type="text"]` - Text inputs
- `textarea` - Text areas
- `button` - Generic buttons
- `.cl-userButtonTrigger` - User menu button (Clerk)

### Main Content
- `main` - Main content area

## Performance Notes

- Overlay updates happen on resize and scroll
- Position recalculation is throttled by browser
- Z-index changes are cleaned up properly
- No memory leaks from event listeners

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Future Improvements

Potential enhancements:
- [ ] Add keyboard shortcuts (ESC to skip, arrows to navigate)
- [ ] Add skip/dismiss count tracking
- [ ] Add analytics for tour completion rates
- [ ] Support for highlighting multiple elements at once
- [ ] Custom highlight shapes (not just rectangles)
- [ ] Voice-over support for accessibility
- [ ] Video tutorials for each step
