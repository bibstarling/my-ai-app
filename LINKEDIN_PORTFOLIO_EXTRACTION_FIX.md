# LinkedIn & Portfolio URL Extraction Fix

## 🐛 Issue

LinkedIn and portfolio URLs were not being included in generated resumes, even though they were available in the user's profile markdown.

**Problem:**
- Only email and portfolio URL were being extracted from markdown
- LinkedIn URL was only pulled from `portfolio_data` (structured data)
- If user wrote their LinkedIn in markdown but not in structured data, it wouldn't appear in resumes
- Portfolio URL extraction existed but LinkedIn extraction was missing

## ✅ What Was Fixed

### **1. Added LinkedIn URL Extraction from Markdown**

**Files:** 
- `app/api/resume/generate/route.ts`
- `app/api/jobs/tailor-resume/route.ts`

**Before:**
```typescript
// Only extracted name, email, and portfolio URL from markdown
let extractedName = null;
let extractedEmail = null;
let extractedPortfolioUrl = null;

// LinkedIn was ONLY from portfolio_data
linkedin_url: portfolioInfo.linkedinUrl || portfolioData.linkedinUrl
```

**After:**
```typescript
// Now extracts ALL contact info from markdown including LinkedIn
let extractedName = null;
let extractedEmail = null;
let extractedLinkedIn = null;  // ✅ NEW
let extractedPortfolioUrl = null;

// Extract LinkedIn with multiple patterns
const linkedInPatterns = [
  /(?:linkedin|linked-in)[\s:]*(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
];

for (const pattern of linkedInPatterns) {
  const match = portfolioMarkdown.match(pattern);
  if (match) {
    extractedLinkedIn = match[0].startsWith('http') 
      ? match[0] 
      : `https://linkedin.com/in/${match[1]}`;
    break;
  }
}

// LinkedIn uses fallback chain with markdown extraction
const linkedInUrl = 
  portfolioInfo?.linkedinUrl || 
  portfolioInfo?.linkedInUrl || 
  extractedLinkedIn ||  // ✅ NEW - from markdown
  portfolioData.linkedinUrl || 
  null;
```

**Result:** LinkedIn URLs are now extracted from markdown profile just like email and portfolio URLs.

### **2. Enhanced Fallback Chain for LinkedIn**

**Before:**
```typescript
linkedin_url: portfolio.linkedinUrl || portfolio.linkedin || ''
```

**After:**
```typescript
// Comprehensive fallback with markdown extraction
const linkedInUrl = 
  portfolio?.linkedinUrl ||      // Structured data (camelCase)
  portfolio?.linkedInUrl ||      // Structured data (PascalCase)
  extractedLinkedIn ||           // ✅ From markdown
  '';

// Use in resume creation
linkedin_url: linkedInUrl
```

**Result:** LinkedIn URL found from any source (structured data or markdown).

### **3. Updated AI Prompts to Show LinkedIn**

Both resume generation routes now inform the AI that LinkedIn is included:

**Before:**
```
📌 CONTACT INFORMATION - ALREADY HANDLED:
- Candidate's full name: John Smith
- Candidate's email: john@example.com
- Portfolio URL: www.johnsmith.com
```

**After:**
```
📌 CONTACT INFORMATION - ALREADY HANDLED:
- Candidate's full name: John Smith
- Candidate's email: john@example.com
- LinkedIn: https://linkedin.com/in/johnsmith  ✅ NEW
- Portfolio URL: www.johnsmith.com
```

**Result:** AI knows LinkedIn is being included and won't try to add it to content.

## 📊 How It Works Now

### Markdown Extraction Patterns

The system now recognizes these LinkedIn formats in your markdown:

```markdown
LinkedIn: https://linkedin.com/in/johnsmith
Linked-in: linkedin.com/in/johnsmith
https://www.linkedin.com/in/johnsmith
linkedin.com/in/johnsmith

Portfolio: www.johnsmith.com
Website: https://johnsmith.com
```

### Complete Fallback Chain

When generating a resume, the system looks for contact information in this order:

**For Name:**
1. `portfolio_data.fullName`
2. First markdown heading (`# Your Name`)
3. Hardcoded fallback (`portfolioData.fullName`)

**For Email:**
1. `portfolio_data.email`
2. Extracted from markdown (Email:, Contact:, etc.)
3. Hardcoded fallback

**For LinkedIn:** ✅ UPDATED
1. `portfolio_data.linkedinUrl`
2. `portfolio_data.linkedInUrl`
3. **Extracted from markdown** (LinkedIn:, linkedin.com/in/...)
4. Fallback to null

**For Portfolio URL:**
1. `portfolio_data.websiteUrl`
2. `portfolio_data.website`
3. Extracted from markdown (Portfolio:, Website:, etc.)
4. Fallback to null

## 🎯 What to Expect Now

### If You Have LinkedIn in Your Markdown:

```markdown
# John Smith

Email: john@example.com
LinkedIn: linkedin.com/in/johnsmith
Portfolio: www.johnsmith.com

## About Me
...
```

**Generated Resume Header:**
```
Name: John Smith
Email: john@example.com
LinkedIn: https://linkedin.com/in/johnsmith  ✅ INCLUDED
Portfolio: www.johnsmith.com                 ✅ INCLUDED
```

### Multiple Format Support:

All these formats will be recognized:
```markdown
LinkedIn: https://linkedin.com/in/johnsmith
LinkedIn: linkedin.com/in/johnsmith
Linked-in: www.linkedin.com/in/johnsmith
https://linkedin.com/in/johnsmith
```

## 🔧 Files Updated

### 1. `app/api/resume/generate/route.ts`
- Added `extractedLinkedIn` variable
- Added LinkedIn extraction patterns
- Created `linkedInUrl` fallback chain with markdown extraction
- Updated resume insert to use `linkedInUrl`
- Updated AI prompt to show LinkedIn in contact info

### 2. `app/api/jobs/tailor-resume/route.ts`
- Added `extractedLinkedIn` variable
- Added LinkedIn extraction patterns
- Created `linkedInUrl` fallback chain with markdown extraction
- Updated resume insert to use `linkedInUrl`
- Updated AI prompt to show LinkedIn in contact info

## ✨ Testing Your Fix

### Test LinkedIn Extraction:

1. **Go to Professional Profile page**
2. **Add LinkedIn to your markdown:**
   ```markdown
   # Your Name
   
   Email: your@email.com
   LinkedIn: linkedin.com/in/yourprofile
   Portfolio: www.yoursite.com
   ```
3. **Save the profile**
4. **Generate a resume for any job**
5. **✅ Verify LinkedIn appears in resume header**

### Test Portfolio URL:

1. **Ensure portfolio URL is in your markdown:**
   ```markdown
   Portfolio: www.yoursite.com
   ```
2. **Generate a resume**
3. **✅ Verify portfolio URL appears in resume header**

### Supported Formats:

Test that all these work in your markdown:

```markdown
# Your Name

Email: you@email.com
LinkedIn: https://linkedin.com/in/yourname
Portfolio: www.yourportfolio.com

# OR

# Your Name

Contact: you@email.com
Linked-in: linkedin.com/in/yourname
Website: https://yourportfolio.com

# OR

# Your Name

you@email.com
https://linkedin.com/in/yourname
https://yourportfolio.com
```

## 📝 Summary

**Before:**
- ❌ LinkedIn URL not extracted from markdown
- ❌ Only available if stored in portfolio_data
- ❌ Users had to manually add LinkedIn to structured data
- ✅ Portfolio URL extraction worked

**After:**
- ✅ LinkedIn URL extracted from markdown
- ✅ Works from both structured data and markdown
- ✅ Multiple format recognition (with/without labels, http/https)
- ✅ Portfolio URL extraction enhanced with better fallbacks
- ✅ Both always included in resumes if they exist
- ✅ AI informed that both URLs are included

**Impact:**
- LinkedIn and portfolio URLs now always appear in resumes when available
- Users can write contact info naturally in markdown
- More robust extraction with comprehensive fallback chains
- Consistent behavior across both resume generation endpoints

---

**Status:** ✅ Fixed and ready to deploy!

**Next Steps:**
1. Add your LinkedIn and portfolio URL to your profile markdown if not already there
2. Generate a new resume
3. Verify both LinkedIn and portfolio URLs appear in the header
