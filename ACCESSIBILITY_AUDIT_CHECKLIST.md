# ♿ Careers Page Accessibility Audit Checklist

**Date**: 28 January 2026  
**WCAG Standard**: WCAG 2.1 Level AA  
**Tested By**: [Your Name]  
**URL**: https://zintra-sandy.vercel.app/careers  
**Status**: Ready for Audit

---

## 📋 Quick Start

### Tools You'll Need:
1. **Lighthouse** (Chrome DevTools) - Accessibility score
2. **axe DevTools** (Browser extension) - Detailed violations
3. **WAVE** (WebAIM) - Visual feedback
4. **Screen Reader** (NVDA for Windows / VoiceOver for Mac)
5. **Color Contrast Checker** - Verify contrast ratios

### How to Run:
1. Open careers page in Chrome
2. Press `F12` to open DevTools
3. Go to **Lighthouse** tab
4. Select "Accessibility" category
5. Click "Analyze page load"
6. Review results and fix issues

---

## 🎯 WCAG 2.1 Level AA Audit

### A. Perceivable

#### 1.1 Text Alternatives (Images)

**Success Criterion**: 1.1.1 Non-text Content

- [ ] All images have `alt` attributes
- [ ] Alt text describes image purpose (not "image", "photo", "pic")
- [ ] Decorative images have empty alt: `alt=""`
- [ ] Logo has company name: `alt="Zintra Logo"`
- [ ] Hero images have descriptive alt text
- [ ] Employer logos have company names
- [ ] Worker avatars have names

**Examples - CORRECT:**
```jsx
<img alt="Zintra verified employer badge" src="badge.png" />
<img alt="" src="decorative-line.png" /> {/* Decorative */}
<img alt="John Mwaura - Electrician" src="worker.jpg" />
```

**Examples - INCORRECT:**
```jsx
<img alt="image" src="worker.jpg" /> {/* Too vague */}
<img src="badge.png" /> {/* Missing alt */}
<img alt="pic" src="decorative.png" /> {/* Should be empty */}
```

**Files to Check:**
- `components/careers/HeroSearch.js` - Hero images
- `components/careers/WhyZintra.js` - Differentiator icons
- `components/careers/FeaturedEmployers.js` - Employer logos
- `components/careers/TopRatedTalent.js` - Worker avatars

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

#### 1.3 Adaptable (Content Structure)

**Success Criterion**: 1.3.1 Info & Relationships

- [ ] Content structure uses semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [ ] Reading order makes sense (top to bottom, left to right)
- [ ] Form labels are associated with inputs (`<label for="id">`)
- [ ] Related items are grouped together
- [ ] No layout tables used (should use CSS grid/flexbox)

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 1.3.4 Orientation

- [ ] Content isn't locked to portrait or landscape only
- [ ] Page works in both orientations
- [ ] Zoom to 200% doesn't require horizontal scroll

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 1.4.10 Reflow

- [ ] At 320px width, content reflows without horizontal scroll
- [ ] Text can be zoomed 200% without losing information
- [ ] Double-column layout becomes single-column on mobile
- [ ] No content is cut off

**Test**: Open DevTools → Device Toolbar → Set width to 320px
- [ ] No horizontal scroll
- [ ] All content readable

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

#### 1.4 Distinguishable (Color & Contrast)

**Success Criterion**: 1.4.3 Color Contrast (Minimum)

**WCAG AA Standard**: 
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI Components: 3:1 contrast ratio

**How to Test:**
1. Use [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Copy foreground color and background color
3. Enter both colors
4. Check that contrast ratio is:
   - ≥ 4.5:1 for normal text
   - ≥ 3:1 for large text

**Elements to Check:**
- [ ] Hero headline (text vs background)
- [ ] Hero subheading
- [ ] "Why Zintra" section heading
- [ ] Card titles in "Why Zintra"
- [ ] Card descriptions
- [ ] Form labels
- [ ] Form placeholder text
- [ ] Links (text color vs background)
- [ ] Link hover state
- [ ] Button text (white on orange)
- [ ] Secondary button text (gray on white)
- [ ] Proof points text
- [ ] Footer text

**Current Colors in Use:**
- Primary Orange: `#ea8f1e`
- White: `#ffffff`
- Light Gray: `#aaabaa`
- Dark Gray: `#5f6466`
- Heading: `#111827` (gray-900)
- Body: `#374151` (gray-700)

**Known Issues to Check:**
- [ ] Button text on orange background passes (white on #ea8f1e)
- [ ] Light gray text on white background passes (#aaabaa on white = ?)
- [ ] "Why Zintra" blue background has sufficient contrast

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 1.4.5 Images of Text

- [ ] Text is not presented as image (except logo/branding)
- [ ] If images contain text, alt text includes that text

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 1.4.11 Non-text Contrast

- [ ] UI components have 3:1 contrast ratio
- [ ] Graphical elements have 3:1 contrast ratio
- [ ] Icons are distinguishable

**Examples to Check:**
- [ ] Orange button text vs orange background
- [ ] Lucide icons (CheckCircle2, Shield, etc.)
- [ ] Border colors

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

### B. Operable

#### 2.1 Keyboard Accessible

**Success Criterion**: 2.1.1 Keyboard

- [ ] All functionality available via keyboard
- [ ] No keyboard trap (can't get stuck on an element)
- [ ] Tab order is logical (left to right, top to bottom)
- [ ] Form can be submitted with keyboard

**How to Test:**
1. Remove mouse from desk
2. Use only Tab key to navigate
3. Use Enter/Space to activate buttons
4. Check that:
   - [ ] Can tab to all interactive elements
   - [ ] Can tab out of all elements
   - [ ] Tab order makes sense
   - [ ] Can submit form with Enter key
   - [ ] Can toggle Jobs/Gigs with keyboard

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 2.1.2 No Keyboard Trap

- [ ] User can navigate away from any component using keyboard
- [ ] Focus indicators are visible
- [ ] No elements trap keyboard focus

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

#### 2.4 Navigable

**Success Criterion**: 2.4.3 Focus Order

- [ ] Tab order follows visual order
- [ ] Focus doesn't jump around unexpectedly
- [ ] Focus returns to logical location after interaction

**Current Tab Order Should Be:**
1. Jobs/Gigs toggle buttons
2. Role input
3. Location input
4. Search button
5. "Post a job" link
6. "Post a gig" link

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 2.4.7 Focus Visible

- [ ] All interactive elements show focus indicator
- [ ] Focus outline is visible (not removed)
- [ ] Focus indicator has sufficient contrast (3:1)
- [ ] Focus indicator is at least 2px

**Check:**
- [ ] Buttons have visible focus ring
- [ ] Inputs have visible focus ring (border or outline)
- [ ] Links have visible focus ring
- [ ] Toggle buttons have visible focus ring

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

### C. Understandable

#### 3.1 Readable

**Success Criterion**: 3.1.1 Language of Page

- [ ] Page has `lang="en"` attribute: `<html lang="en">`
- [ ] Content is in English (or language is specified)

**Check**: Open page source → look for `<html>` tag

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

#### 3.3 Input Assistance

**Success Criterion**: 3.3.1 Error Identification

- [ ] Form errors are clearly identified
- [ ] Error location is obvious
- [ ] Error description is helpful
- [ ] Error is associated with form field

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 3.3.2 Labels or Instructions

- [ ] All form fields have labels
- [ ] Labels are visible (not hidden)
- [ ] Labels are associated with inputs using `for` attribute

**Example - CORRECT:**
```jsx
<label htmlFor="role">Role or Skill</label>
<input id="role" name="role" type="text" />
```

**Example - INCORRECT:**
```jsx
<input placeholder="Role or Skill" /> {/* No label */}
<label>Role or Skill
  <input type="text" />
</label> {/* Implicit association, less reliable */}
```

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

### D. Robust

#### 4.1 Compatible

**Success Criterion**: 4.1.1 Parsing

- [ ] HTML is valid (no unclosed tags)
- [ ] No duplicate IDs
- [ ] Attributes are properly formatted

**How to Test:**
1. Go to [W3C HTML Validator](https://validator.w3.org/)
2. Paste URL: https://zintra-sandy.vercel.app/careers
3. Click "Check"
4. Review errors and warnings

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

**Success Criterion**: 4.1.2 Name, Role, Value

- [ ] All UI components have accessible name
- [ ] All UI components have proper role
- [ ] State/properties are exposed to assistive tech

**Examples:**
- Buttons: `<button>Click me</button>` ✓
- Inputs: `<input aria-label="Search">` ✓
- Icons without text: `<button aria-label="Menu"><Menu /></button>` ✓

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

#### 4.1.3 Status Messages

- [ ] Success messages announced to screen readers
- [ ] Error messages announced to screen readers
- [ ] Status updates don't require focus change

**Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIX

---

## 🔊 Screen Reader Testing

### Tools:
- **Mac**: VoiceOver (built-in, press Cmd+F5)
- **Windows**: NVDA (free, https://www.nvaccess.org/)
- **Chrome**: ChromeVox (extension)

### Test Scenarios:

#### Scenario 1: Navigate Hero Section
**Expected**: Screen reader announces:
- Heading: "Find Verified Construction Jobs & Gigs Across Kenya"
- Paragraph: "Join 2,400+ workers earning KES 50K-150K monthly"
- Paragraph: "Work with 180+ trusted employers. Zero upfront fees. Fast, secure payments."

**Actual**: [Add test result]

**Status**: [ ] PASS [ ] FAIL

---

#### Scenario 2: Navigate Why Zintra Section
**Expected**: Screen reader announces:
- Heading: "Why Join Zintra?"
- 3 cards with title and description each:
  1. Shield icon - "Verified Employers Only" - [description]
  2. CheckCircle icon - "No Upfront Fees" - [description]
  3. Zap icon - "Fast Payments" - [description]

**Actual**: [Add test result]

**Status**: [ ] PASS [ ] FAIL

---

#### Scenario 3: Fill Out Search Form
**Expected**: Screen reader announces:
- "Find Jobs" and "Find Gigs" toggle buttons
- "Role or Skill" label and input
- "Location" label and input
- "Search Jobs" button
- Can submit form

**Actual**: [Add test result]

**Status**: [ ] PASS [ ] FAIL

---

### Screen Reader Issues Found:
```
[Add any issues here, e.g.:
- Icons not announced with alt text
- Form labels not properly associated
- Status messages not announced
]
```

---

## 🚦 Automated Testing Results

### Lighthouse Accessibility Score
- **Target**: ≥ 90/100
- **Current Score**: ?
- **Issues**: [Run audit and list here]

### axe DevTools Results
- **Critical Issues**: ?
- **Serious Issues**: ?
- **Moderate Issues**: ?
- **Minor Issues**: ?

### WAVE Results
- **Errors**: ?
- **Contrast Errors**: ?
- **Missing Alt Text**: ?

---

## 📊 Audit Summary

| Category | Status | Issues | Priority |
|----------|--------|--------|----------|
| **Text Alternatives** | ? | ? | ? |
| **Headings & Structure** | ? | ? | ? |
| **Color & Contrast** | ? | ? | ? |
| **Keyboard Navigation** | ? | ? | ? |
| **Focus Management** | ? | ? | ? |
| **Form Labels** | ? | ? | ? |
| **Screen Reader** | ? | ? | ? |
| **Mobile Accessibility** | ? | ? | ? |
| **Orientation** | ? | ? | ? |
| **Zoom & Reflow** | ? | ? | ? |

---

## 🔴 Issues Found

### Issue Template:
```
**Issue #**: [1]
**WCAG Criterion**: [1.4.3, 2.1.1, etc.]
**Severity**: [Critical / High / Medium / Low]
**Component**: [HeroSearch / WhyZintra / etc.]
**Description**: [What's wrong?]
**Steps to Reproduce**: 
  1. [Step 1]
  2. [Step 2]
**Expected**: [Should work like this]
**Actual**: [Currently broken like this]
**Fix**: [How to fix it]
**Testing Tool**: [Lighthouse / axe / WAVE / Screen Reader]
```

### Issues List:
[None yet - add during testing]

---

## ✅ Quick Fixes Checklist

These are common issues that are easy to fix:

### Fix #1: Add Missing Alt Text
**Time**: 15 min
- [ ] HeroSearch.js images
- [ ] WhyZintra.js icons
- [ ] FeaturedEmployers.js logos

### Fix #2: Verify Contrast Ratios
**Time**: 30 min
- [ ] Check all text colors
- [ ] Check all button colors
- [ ] Check all link colors

### Fix #3: Test Keyboard Navigation
**Time**: 20 min
- [ ] Remove mouse, tab through page
- [ ] Check tab order
- [ ] Verify all buttons are accessible

### Fix #4: Add Focus Indicators
**Time**: 30 min
- [ ] Ensure all buttons have visible focus
- [ ] Ensure all inputs have visible focus
- [ ] Ensure all links have visible focus

### Fix #5: Label Form Inputs
**Time**: 15 min
- [ ] Add `htmlFor` to Role label
- [ ] Add `htmlFor` to Location label
- [ ] Verify labels are visible

---

## 🎯 Success Criteria

Page passes accessibility audit if:
- ✅ Lighthouse score ≥ 90/100
- ✅ No CRITICAL or SERIOUS axe violations
- ✅ All images have alt text
- ✅ Color contrast ≥ 4.5:1 (text) or 3:1 (components)
- ✅ Keyboard navigation works
- ✅ All focus indicators visible
- ✅ All form fields labeled
- ✅ Screen reader announces content correctly
- ✅ Page works at 200% zoom
- ✅ No horizontal scroll at any zoom level

---

## 📝 Sign-Off

- **Audited By**: _________________
- **Date**: _________________
- **Tools Used**: Lighthouse, axe, WAVE, Screen Reader
- **Overall Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIXES
- **WCAG Level**: [ ] A [ ] AA ✓ [ ] AAA
- **Lighthouse Score**: _____/100

---

## 📚 WCAG 2.1 Reference

- **Level A**: Basic web accessibility (1 star)
- **Level AA**: Enhanced accessibility (2 stars) ← **WE'RE HERE**
- **Level AAA**: Excellent accessibility (3 stars)

**Target**: WCAG 2.1 Level AA (industry standard for most websites)

---

## 🔗 Helpful Resources

1. **WCAG 2.1 Guide**: https://www.w3.org/WAI/WCAG21/quickref/
2. **WebAIM**: https://webaim.org/
3. **Accessibility Insights**: https://accessibilityinsights.io/
4. **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

**Document Version**: 1.0  
**Created**: 28 January 2026  
**Last Updated**: [Today's date]  
**WCAG Standard**: 2.1 Level AA
