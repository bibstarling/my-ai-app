# Responsive Design Guide

## Overview

This guide documents the responsive design patterns and best practices implemented throughout the Applause application. All components are designed to work seamlessly across mobile (320px+), tablet (768px+), and desktop (1024px+) devices.

---

## Breakpoints

### Tailwind Custom Breakpoints

```javascript
// tailwind.config.js
screens: {
  'xs': '475px',   // Extra small devices
  'sm': '640px',   // Small devices (default)
  'md': '768px',   // Medium devices (tablets)
  'lg': '1024px',  // Large devices (laptops)
  'xl': '1280px',  // Extra large devices
  '2xl': '1536px', // 2X large devices
}
```

### Breakpoint Usage Strategy

- **Mobile-first approach**: Start with mobile styles, then add breakpoint prefixes for larger screens
- **Progressive enhancement**: Base styles work on all devices, enhanced for larger screens
- **Touch-friendly**: Ensure all interactive elements are at least 44x44px on mobile

---

## Layout Components

### AppLayout & Navigation

#### Mobile Menu (< 768px)
- **Hamburger menu** in sticky header
- **Slide-in sidebar** from left with overlay
- **Full-width header** with brand logo and menu toggle
- Menu closes automatically on route change

```tsx
// Mobile header (visible < md)
<div className="md:hidden sticky top-0 z-50 bg-white border-b">
  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
    {/* Hamburger icon */}
  </button>
</div>

// Mobile sidebar
<aside className={`
  fixed left-0 h-screen
  max-md:top-[57px]
  ${isMobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
`}>
```

#### Desktop Menu (≥ 768px)
- **Fixed sidebar** (64px collapsed, 256px expanded)
- **No hamburger menu** (always visible)
- Content adjusts with `md:ml-16 lg:ml-64`

---

## Typography Scale

### Responsive Text Sizing

Use responsive text classes to ensure readability across devices:

```tsx
// Headings
<h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
<h2 className="text-lg sm:text-xl md:text-2xl font-bold">
<h3 className="text-base sm:text-lg md:text-xl font-semibold">

// Body text
<p className="text-sm sm:text-base">

// Small text
<span className="text-xs sm:text-sm">
```

### Font Size Reference

| Element | Mobile (xs) | Tablet (md) | Desktop (lg) |
|---------|-------------|-------------|--------------|
| H1 | 1.25rem (20px) | 1.5rem (24px) | 1.875rem (30px) |
| H2 | 1.125rem (18px) | 1.25rem (20px) | 1.5rem (24px) |
| Body | 0.875rem (14px) | 1rem (16px) | 1rem (16px) |
| Small | 0.75rem (12px) | 0.875rem (14px) | 0.875rem (14px) |

---

## Spacing & Layout

### Container Padding

```tsx
// Responsive padding
<div className="px-3 sm:px-4 md:px-6">  // Horizontal
<div className="py-4 sm:py-6 md:py-8">  // Vertical

// Gaps between elements
<div className="gap-3 sm:gap-4 md:gap-6">
<div className="space-y-4 sm:space-y-6 md:space-y-8">
```

### Grid Layouts

```tsx
// 2-column mobile, 4-column desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

// 1-column mobile, 2-column tablet, 3-column desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar layout
<div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
  <div className="lg:col-span-2">Main</div>
  <div>Sidebar</div>
</div>
```

---

## Component Patterns

### Cards

```tsx
<div className="bg-white rounded-xl border-2 border-border p-4 sm:p-6 hover-lift">
  <div className="flex items-start gap-3 sm:gap-4">
    <div className="p-2 sm:p-3 bg-accent rounded-xl shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm sm:text-base font-bold">{title}</h3>
      <p className="text-xs sm:text-sm text-muted">{description}</p>
    </div>
  </div>
</div>
```

**Key principles:**
- Reduced padding on mobile (`p-4`) vs desktop (`p-6`)
- `min-w-0` prevents text overflow
- `shrink-0` on icons prevents compression
- Smaller gaps on mobile

### Buttons

```tsx
// Primary action
<button className="
  px-4 py-2 sm:px-6 sm:py-2.5
  text-sm sm:text-base
  bg-accent text-white
  rounded-lg
  font-medium
">

// Icon button
<button className="p-1.5 sm:p-2 rounded-lg">
  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
</button>
```

### Modals

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
  <div className="
    w-full max-w-md
    max-h-[90vh] sm:max-h-[85vh]
    bg-white rounded-xl
    overflow-hidden
    flex flex-col
  ">
    {/* Header */}
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
      <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
    </div>
    
    {/* Scrollable body */}
    <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1">
      {children}
    </div>
    
    {/* Footer */}
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
      <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
        <button>Cancel</button>
        <button>Confirm</button>
      </div>
    </div>
  </div>
</div>
```

**Key principles:**
- Smaller padding/margin on mobile
- `max-h-[90vh]` prevents overflow on small screens
- Stack buttons vertically on extra-small devices
- `overflow-y-auto` on body with `flex-1` for proper scrolling

---

## Forms & Inputs

### Input Fields

```tsx
<input className="
  w-full
  px-3 sm:px-4
  py-2
  text-sm sm:text-base
  border border-gray-300
  rounded-lg
  focus:ring-2 focus:ring-blue-500
" />
```

### Form Layouts

```tsx
// Stack on mobile, side-by-side on tablet+
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium">Field 1</label>
    <input />
  </div>
  <div>
    <label className="text-sm font-medium">Field 2</label>
    <input />
  </div>
</div>
```

---

## Special Components

### Kanban Board (My Jobs)

```tsx
<div className="
  flex gap-4
  overflow-x-auto
  kanban-scroll
">
  <div className="
    min-w-[280px] sm:min-w-[300px]
    flex-1
    max-w-sm
  ">
    {/* Column content */}
  </div>
</div>
```

**Mobile optimizations:**
- Horizontal scroll with touch-friendly column width (280px min)
- Cards have reduced padding: `p-3 sm:p-4`
- Smaller icons: `h-3.5 w-3.5 sm:h-4 sm:w-4`
- Compact text: `text-sm sm:text-base`

### Floating Chat Panel (Portfolio Builder)

```tsx
<div className="
  fixed inset-y-0 right-0 z-50
  w-full sm:w-[420px]
  max-w-full
  bg-white shadow-2xl
">
```

**Mobile behavior:**
- Full width on mobile (`w-full`)
- Fixed width on tablet+ (`sm:w-[420px]`)
- Slides in from right on all devices

---

## Utility Classes Reference

### Visibility Helpers

```tsx
// Show/hide by breakpoint
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Inline vs block toggle
<span className="hidden xs:inline">Desktop text</span>
<span className="xs:hidden">Mobile text</span>
```

### Flexbox Helpers

```tsx
// Responsive direction
<div className="flex flex-col sm:flex-row">

// Responsive alignment
<div className="items-start sm:items-center">

// Responsive gaps
<div className="gap-3 sm:gap-4 md:gap-6">
```

### Text Utilities

```tsx
// Prevent overflow
<div className="min-w-0 truncate">        // Single line
<div className="min-w-0 line-clamp-2">    // Two lines
<div className="break-words">              // Word break
<div className="overflow-wrap-anywhere">   // Break anywhere
```

### Sizing Utilities

```tsx
// Responsive sizing
<div className="w-8 sm:w-10 md:w-12">
<div className="h-4 sm:h-5 md:h-6">

// Max heights for scrolling
<div className="max-h-[85vh] overflow-y-auto">
```

---

## Touch Interaction Guidelines

### Minimum Touch Targets

All interactive elements should meet these minimum sizes on mobile:

- **Buttons**: 44x44px minimum
- **Links**: 44x44px hit area (use padding if needed)
- **Icons**: 44x44px clickable area
- **Form inputs**: 44px minimum height

```tsx
// Icon button with sufficient touch area
<button className="p-2 sm:p-2.5">  // 16px padding = 44px+ touch area
  <Icon className="h-5 w-5" />
</button>
```

### Hover vs Touch States

```tsx
// Desktop hover, mobile/tablet active state
<button className="
  hover:bg-gray-50
  active:bg-gray-100
  transition-colors
">
```

---

## Common Pitfalls & Solutions

### ❌ Fixed Widths

```tsx
// Bad - breaks on small screens
<div className="w-[420px]">

// Good - responsive with max-width
<div className="w-full sm:w-[420px] max-w-full">
```

### ❌ Non-wrapping Flex

```tsx
// Bad - can overflow
<div className="flex gap-4">

// Good - wraps on small screens
<div className="flex flex-wrap gap-2 sm:gap-4">
```

### ❌ Small Text on Mobile

```tsx
// Bad - too small on mobile
<p className="text-xs">

// Good - responsive sizing
<p className="text-xs sm:text-sm">
```

### ❌ Large Padding on Small Screens

```tsx
// Bad - wastes mobile space
<div className="p-6">

// Good - responsive padding
<div className="p-4 sm:p-6">
```

---

## Testing Checklist

Test all changes at these key breakpoints:

- ✅ **320px** - iPhone SE (smallest modern device)
- ✅ **375px** - iPhone 12/13/14 Pro
- ✅ **428px** - iPhone 14 Pro Max
- ✅ **768px** - iPad Portrait
- ✅ **1024px** - iPad Landscape / Small laptop
- ✅ **1280px** - Standard laptop
- ✅ **1920px** - Desktop

### Browser DevTools

Use Chrome DevTools responsive mode:
1. Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows)
2. Test each breakpoint
3. Verify touch targets (≥ 44x44px)
4. Check text readability
5. Ensure no horizontal scroll

---

## Performance Considerations

### Image Optimization

```tsx
// Use responsive images
<img
  srcSet="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1024w.jpg 1024w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src="image-1024w.jpg"
  alt="Description"
/>
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Examples from the Codebase

### Dashboard Quick Actions

**Mobile (< 640px)**: Single column, compact padding
**Tablet+ (≥ 640px)**: Two columns, standard padding

```tsx
<div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
  <Link className="p-4 sm:p-6 hover-lift">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="p-2 sm:p-3 rounded-xl shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-bold">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted">
          {description}
        </p>
      </div>
    </div>
  </Link>
</div>
```

### Job Discovery Filters

**Mobile**: Stack vertically, full width
**Tablet+**: Grid layout

```tsx
<div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
  <div>
    <label className="text-sm font-medium">Remote Type</label>
    {/* Filters */}
  </div>
</div>
```

---

## Future Enhancements

Consider these improvements for the next iteration:

1. **Container queries** - Once browser support improves, use `@container` for component-level responsiveness
2. **Dynamic viewport units** - Use `dvh` (dynamic viewport height) for mobile browsers with collapsing address bars
3. **Fluid typography** - Implement `clamp()` for smooth text scaling
4. **Responsive tables** - Add horizontal scroll with sticky columns for data tables

---

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)

---

**Last Updated**: February 10, 2026  
**Version**: 1.0.0
