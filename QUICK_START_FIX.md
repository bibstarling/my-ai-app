# Quick Start - Fix Google Sign-In Bugs

## 🚀 Quick Fix (3 Steps)

### Step 1: Apply Database Migration
Open Supabase SQL Editor and run the migration:
👉 https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new

Copy and paste the contents of:
```
supabase/migrations/20260211_fix_users_rls.sql
```

### Step 2: Start Your App
```bash
npm run dev
```

### Step 3: Sync Emails (Easy Way!)
1. Go to admin: http://localhost:3000/admin
2. You'll see a button that says **"Sync Missing Emails from Clerk"**
3. Click it!
4. Done! ✅

## ✅ What Got Fixed

1. **Email now saves when users sign in with Google**
   - Fixed `/api/users/settings` to capture emails from Clerk

2. **Users now appear in admin area**
   - Admin page uses secure API endpoints
   - Fixed RLS policies for proper security

3. **Bonus: Better security!**
   - Database now has proper Row Level Security policies
   - Admin operations go through secure backend endpoints

## 📋 Verify Everything Works

After the fix:
- [ ] Go to admin area
- [ ] Click "Sync Missing Emails" if you see the button
- [ ] You should see your friend's user with their email
- [ ] Have your friend sign out and back in
- [ ] Their email should save correctly now

## 🐛 If Something Doesn't Work

**Don't see the sync button?**
- Good! It only appears if there are users without emails

**Sync button doesn't work?**
- Check browser console (F12) for errors
- Verify you're signed in as admin (bibstarling@gmail.com)

**User still doesn't appear?**
- Make sure the migration was applied
- Restart your dev server
- Check that your `.env.local` has the correct Supabase keys

## 📚 Full Documentation

- Detailed explanation: `BUG_FIXES_2026-02-11.md`
- Complete guide: `FIX_GOOGLE_SIGNIN_BUGS.md`

## 🎉 That's It!

The bugs are fixed. New users signing in with Google will have their emails saved automatically, and you can easily sync emails for existing users right from the admin panel.
