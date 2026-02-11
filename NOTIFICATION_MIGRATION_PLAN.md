# Browser Dialog Replacement - Migration Plan

## ✅ Infrastructure Complete

- [x] Toast notification system (`Toast.tsx`, `ToastContainer.tsx`)
- [x] Confirmation dialog system (`ConfirmDialog.tsx`)
- [x] Unified hook (`useNotification.ts`)
- [x] Providers integrated into `ClientAuthWrapper.tsx`

## 📊 Scope

**Total Replacements Needed:**
- **96 `alert()` calls** across 19 files
- **9 `confirm()` calls** across 9 files
- **0 `prompt()` calls**

## 🎯 Priority Files (User-Facing)

### High Priority (Most User Impact)
1. ✅ `app/assistant/my-jobs/page.tsx` - 27 alerts, 1 confirm (Job management)
2. ✅ `app/portfolio/builder/page.tsx` - 9 alerts (Profile builder)
3. ✅ `app/resume-builder/page.tsx` - 6 alerts, 1 confirm (Resume editor)
4. ✅ `app/cover-letters/page.tsx` - 3 alerts, 1 confirm (Cover letter list)
5. ✅ `app/(dashboard)/profile/page.tsx` - 6 alerts (User profile settings)

### Medium Priority
6. `app/(dashboard)/job-profile/page.tsx` - 7 alerts (Job search settings)
7. `app/(dashboard)/admin/jobs/sources/page.tsx` - 4 alerts, 1 confirm (Admin)
8. `app/(dashboard)/admin/jobs/page.tsx` - 3 alerts, 1 confirm (Admin)
9. `app/settings/api/page.tsx` - 4 alerts, 1 confirm (API settings)
10. `app/components/SettingsModal.tsx` - 8 alerts, 1 confirm (Settings modal)

### Low Priority (Component-level)
11. `app/components/portfolio/AIAssistantPanel.tsx` - 2 alerts
12. `app/components/portfolio/ManualEditor.tsx` - 2 alerts
13. `app/components/portfolio/MarkdownEditor.tsx` - 1 confirm
14. `app/resume-builder/[id]/adapt/page.tsx` - 3 alerts
15. `app/resume-builder/[id]/page.tsx` - 1 confirm
16. `app/assistant/job-search/page.tsx` - 2 alerts
17. `app/settings/portfolio/page.tsx` - 3 alerts
18. `app/setup/page.tsx` - 1 alert
19. `app/cover-letters/[id]/page.tsx` - 2 alerts
20. `app/resume-builder/[id]/preview/page.tsx` - 1 alert
21. `app/portfolio/builder/page-new.tsx` - 8 alerts (Legacy file?)

## 🔄 Replacement Pattern

### For `alert()`:
```typescript
// Before:
alert('Success message');

// After:
const { showSuccess, showError, showInfo } = useNotification();
showSuccess('Success message');
showError('Error message');
showInfo('Info message');
```

### For `confirm()`:
```typescript
// Before:
if (confirm('Are you sure?')) {
  // do action
}

// After:
const { confirm } = useNotification();
const confirmed = await confirm('Are you sure?', {
  title: 'Confirm Action',
  type: 'danger',
  confirmText: 'Yes, delete',
  cancelText: 'Cancel'
});
if (confirmed) {
  // do action
}
```

## 📝 Implementation Strategy

**Phase 1: Infrastructure** ✅ COMPLETE
- Toast system
- Confirm dialog
- Providers
- Utility hook

**Phase 2: High Priority Pages** (IN PROGRESS)
- Replace alerts in top 5 user-facing pages
- Test each page after replacement
- Deploy incrementally

**Phase 3: Medium Priority**
- Replace alerts in settings & admin pages
- Test thoroughly

**Phase 4: Low Priority**
- Replace remaining component-level alerts
- Clean up legacy files

**Phase 5: Testing & Polish**
- Test all notification scenarios
- Adjust styling if needed
- Add keyboard shortcuts (ESC to close)
- Add animations

## 🎨 UX Improvements Over Browser Dialogs

✅ **Better positioning** - Top-right corner instead of center
✅ **Auto-dismiss** - Toasts auto-dismiss after 5s
✅ **Multiple notifications** - Stack multiple toasts
✅ **Better styling** - Matches app design system
✅ **Keyboard support** - ESC to close, Enter to confirm
✅ **No page blocking** - Toasts don't interrupt workflow
✅ **Accessible** - ARIA labels, focus management
✅ **Mobile-friendly** - Works on all devices

## 📈 Progress Tracking

**Completed: 0/19 files** (Infrastructure only)
**Alerts Remaining: 96**
**Confirms Remaining: 9**

---

**Status:** Infrastructure deployed, ready for systematic replacement.
**Next Step:** Replace alerts in `app/assistant/my-jobs/page.tsx` (27 alerts)
