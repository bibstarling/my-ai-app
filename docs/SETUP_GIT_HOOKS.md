# Setting Up Git Hooks for Translation Validation

## What Are Git Hooks?

Git hooks automatically run scripts before certain Git actions (like commits or pushes). We use them to ensure translations are always validated before code is committed.

## Setup Instructions

### Option 1: Automatic Setup (Recommended)

Run this command to set up the pre-commit hook:

```bash
# On Windows (PowerShell)
mkdir -p .git/hooks
copy .githooks/pre-commit .git/hooks/pre-commit

# On Mac/Linux
mkdir -p .git/hooks
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Option 2: Manual Git Configuration

Configure Git to use the `.githooks` directory:

```bash
git config core.hooksPath .githooks
```

Then make the hook executable (Mac/Linux only):

```bash
chmod +x .githooks/pre-commit
```

## What Does It Do?

The pre-commit hook:
1. ✅ Runs automatically before every `git commit`
2. 🔍 Validates that all translation files have matching keys
3. ❌ Blocks the commit if validation fails
4. ✅ Allows the commit if all translations are valid

## Example Output

### ✅ Successful Commit
```bash
$ git commit -m "Add new feature"
🔍 Validating translations...
✅ pt.json has all required keys
📊 Total translation keys: 81
✅ All translations are valid!
✅ Translations validated successfully!
[main abc123d] Add new feature
```

### ❌ Failed Commit
```bash
$ git commit -m "Add new feature"
🔍 Validating translations...
❌ Missing keys in pt.json (present in en.json):
   - newFeature.title
   - newFeature.description

❌ Translation validation failed!
Please fix the translation issues before committing.
Run 'npm run validate-translations' to see details.
```

## Bypassing the Hook (Not Recommended)

In rare cases where you need to commit without validation:

```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning:** Only use this in emergencies! All translations should be complete before merging to main.

## Troubleshooting

### Hook Not Running

**Problem:** Pre-commit hook doesn't execute

**Solutions:**
1. Check if `.git/hooks/pre-commit` exists
2. Ensure it's executable (Mac/Linux): `chmod +x .git/hooks/pre-commit`
3. Try Option 2 (Manual Git Configuration) above

### Permission Denied (Windows)

**Problem:** Can't execute the hook on Windows

**Solution:** Git hooks on Windows should work without chmod. If issues persist:
1. Make sure you're using Git Bash or PowerShell
2. Check that the file doesn't have a `.sample` extension

### Hook Fails Even When Translations Are Valid

**Problem:** Hook fails but `npm run validate-translations` passes

**Solution:**
1. Make sure you're in the project root directory
2. Run `npm install` to ensure dependencies are up to date
3. Delete and recreate the hook file

## CI/CD Integration

Add this to your CI/CD pipeline (e.g., GitHub Actions):

```yaml
- name: Validate Translations
  run: npm run validate-translations

- name: Build Project
  run: npm run build
```

This ensures translations are validated in your automated builds as well.
