# 🔧 QUICK FIX GUIDE - .JSX vs .JS Standardization

## Status Check: RFQ File Uploads Task

✅ **COMPLETE** - All files created and working:
- `/pages/api/rfq/upload-file.js` - API endpoint for file uploads
- `/components/RFQModal/RFQFileUpload.jsx` - File upload component
- Documentation complete
- Build verified with no errors

---

## File Naming Issue - Immediate Action Items

### The Problem
- Component files use inconsistent naming: some `.js`, some `.jsx`
- Best practice: `.jsx` for components, `.js` for utilities
- Currently: ~90% of components use `.js` (incorrect)

### The Solution
Standardize on `.jsx` for React components going forward.

---

## Phase 1: Immediate (Today)

### ✅ Step 1: Add ESLint Rule
Add to `.eslintrc.json`:

```json
{
  "rules": {
    "react/jsx-filename-extension": [
      "warn",
      {
        "extensions": [".jsx", ".tsx"]
      }
    ]
  }
}
```

**What it does:** Warns when JSX is in `.js` files, guides developers to use `.jsx`

**How to implement:**
```bash
npm run lint
# You'll see warnings about .js files with JSX
```

### ✅ Step 2: New File Convention
**Starting now:** All NEW component files must use `.jsx`

**Examples:**
```
✅ ComponentName.jsx      (new components)
✅ hooks/useHook.js       (hooks stay .js)
✅ lib/utility.js         (utilities stay .js)
❌ ComponentName.js       (don't do this anymore)
```

### ✅ Step 3: Document for Team
Add to project README or CONTRIBUTING.md:

```markdown
## File Naming Convention

### React Components
- **Extension:** `.jsx`
- **Location:** `components/`, `app/`, `pages/`
- **Examples:** `Button.jsx`, `UserProfile.jsx`

### Hooks
- **Extension:** `.js`
- **Location:** `hooks/`
- **Examples:** `useAuth.js`, `useForm.js`

### Utilities & Libraries
- **Extension:** `.js`
- **Location:** `lib/`, `utils/`
- **Examples:** `dateUtils.js`, `api.js`

### API Routes
- **Extension:** `.js`
- **Location:** `pages/api/`, `app/api/`
- **Examples:** `users.js`, `auth.js`
```

---

## Phase 2: Scheduled Update (This Week)

### High Priority Components to Rename

These files are heavily used and should be renamed this week:

```bash
# Run these commands one by one
mv components/vendor-profile/StatusUpdateCard.js components/vendor-profile/StatusUpdateCard.jsx
mv components/DirectRFQModal.js components/DirectRFQModal.jsx
mv components/CategorySelector.js components/CategorySelector.jsx
mv components/SelectWithOther.js components/SelectWithOther.jsx
mv components/PhoneInput.js components/PhoneInput.jsx
```

**After renaming:** Check imports in other files (use Find & Replace):
```bash
# Find all imports of these files and verify they still work
# Most imports will work fine:
import StatusUpdateCard from '...StatusUpdateCard.jsx'  ✅ Works
import StatusUpdateCard from '...StatusUpdateCard'      ✅ Also works
```

### Testing After Rename

```bash
# 1. Build project
npm run build
# Should succeed with no errors

# 2. Run linter
npm run lint
# Should show warnings for remaining .js component files

# 3. Test locally
npm run dev
# Visit affected pages, verify they still work
```

---

## Phase 3: Full Migration (Next Sprint)

Rename remaining component files in groups:

### Group 1: Messages & Interactions
```bash
mv components/MessagesTab.js components/MessagesTab.jsx
mv components/NegotiationThread.js components/NegotiationThread.jsx
mv components/NegotiationQA.js components/NegotiationQA.jsx
```

### Group 2: Forms & Modals
```bash
mv components/RfqFormRenderer.js components/RfqFormRenderer.jsx
mv components/DirectRFQPopup.js components/DirectRFQPopup.jsx
mv components/VendorRFQResponseForm.js components/VendorRFQResponseForm.jsx
```

### Group 3: Vendor Profile
```bash
mv components/vendor-profile/ReactionPicker.js components/vendor-profile/ReactionPicker.jsx
mv components/vendor-profile/EditCommentModal.js components/vendor-profile/EditCommentModal.jsx
# ... other vendor-profile components
```

---

## Batch Rename Script (Optional)

If you want to rename many files at once:

### Using Terminal (Safe)

```bash
# Navigate to components directory
cd components

# Rename all .js files that contain JSX (careful - verify each one)
find . -name "*.js" -type f | while read file; do
  # Check if file contains 'export default function' or 'export const' + JSX
  if grep -q "export\|<.*>" "$file"; then
    newfile="${file%.js}.jsx"
    echo "Rename: $file → $newfile"
    # Uncomment to actually rename:
    # mv "$file" "$newfile"
  fi
done
```

### Using Git (Better - Version Controlled)

```bash
# Git tracks renames better than filesystem
git mv components/StatusUpdateCard.js components/StatusUpdateCard.jsx
```

---

## Checklist for Each Rename

When renaming a file, verify:

- [ ] File contains JSX (exported React component)
- [ ] Build succeeds after rename: `npm run build`
- [ ] No broken imports detected: `npm run lint`
- [ ] Component still renders correctly: `npm run dev`
- [ ] Related tests pass (if tests exist)
- [ ] No TypeScript errors: `npm run type-check`

---

## What NOT to Change

✅ **Keep as `.js`:**
```
pages/api/*.js          (API routes)
hooks/*.js              (React hooks)
lib/*.js                (Utility functions)
context/*.js            (Context providers)
utils/*.js              (Helper functions)
config/*.js             (Configuration)
middleware/*.js         (Middleware)
```

---

## Validation Checklist

Run these after completing Phase 1:

```bash
# 1. Verify ESLint config added
cat .eslintrc.json | grep "jsx-filename-extension"
# Should show the rule

# 2. Run linter to see all violations
npm run lint
# Will show warnings about .js files containing JSX

# 3. Build project
npm run build
# Should succeed

# 4. Test development
npm run dev
# Should start without errors
```

---

## Status Summary

| Phase | Action | Timeline | Status |
|-------|--------|----------|--------|
| Phase 1 | Add ESLint rule | Today | ⏳ Ready |
| Phase 1 | Document convention | Today | ⏳ Ready |
| Phase 1 | Start using .jsx for new files | Now | ⏳ Ready |
| Phase 2 | Rename high-priority components | This week | ⏳ Planned |
| Phase 2 | Test after renames | This week | ⏳ Planned |
| Phase 3 | Rename remaining components | Next sprint | ⏳ Planned |
| Phase 3 | Full migration complete | Next sprint | ⏳ Future |

---

## FAQ

### Q: Will renaming break anything?
**A:** No, Next.js and import resolution work fine with both `.js` and `.jsx`. Renaming is safe.

### Q: Do I need to update imports?
**A:** No, both work:
```javascript
import X from './file.jsx'  ✅
import X from './file'      ✅ (auto-resolves)
```

### Q: What about pages?
**A:** Next.js page routes can use either:
```
app/page.jsx    ✅ (recommended)
app/page.js     ✅ (works, but less clear)
```

### Q: How long will Phase 2 take?
**A:** ~30 minutes for 10 file renames + testing

### Q: Can I do this gradually?
**A:** Yes! Rename a few files each day. No rush.

### Q: What if imports break?
**A:** Run `npm run build` immediately to catch errors. Git history preserves the original, so you can revert if needed.

---

## Quick Command Reference

```bash
# Add ESLint rule (Phase 1)
# Edit .eslintrc.json manually

# Check for violations
npm run lint | grep jsx-filename-extension

# Rename a file (Phase 2)
git mv old-name.js new-name.jsx

# Verify it worked
npm run build && npm run dev

# If something breaks
git checkout HEAD -- .
# (reverses all changes)
```

---

## Next Steps

1. ✅ Review this guide
2. ⏳ Complete Phase 1 (ESLint rule + documentation)
3. ⏳ Complete Phase 2 (rename priority components) 
4. ⏳ Complete Phase 3 (full migration)

**Start with Phase 1 today - it's quick and guides the team for the future.**

