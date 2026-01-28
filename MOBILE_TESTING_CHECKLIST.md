# 📱 Careers Page Mobile Testing Checklist

**Date**: 28 January 2026  
**Tested By**: [Your Name]  
**URL**: https://zintra-sandy.vercel.app/careers  
**Status**: Ready for Testing

---

## Device Testing Environment

### iOS Devices
- [ ] iPhone 14 Pro Max (6.7" OLED)
- [ ] iPhone 14 (6.1" OLED)
- [ ] iPhone 13 mini (5.4" OLED)
- [ ] iPhone SE (4.7" LCD)
- [ ] iPad Pro 12.9" (M2)
- [ ] iPad Air (5th gen)
- [ ] iPad mini (6th gen)

### Android Devices
- [ ] Samsung Galaxy S23 Ultra (6.8" AMOLED)
- [ ] Samsung Galaxy S23 (6.1" AMOLED)
- [ ] Google Pixel 7 Pro (6.7" OLED)
- [ ] OnePlus 11 (6.7" AMOLED)
- [ ] Motorola Edge+ (6.7" OLED)

---

## 🎯 Test Categories

### A. Navigation & Layout

#### Hero Section
- [ ] Hero text is centered and readable
- [ ] Hero images scale properly on small screens
- [ ] Hero text doesn't overlap with images
- [ ] Headline readable (no text cut-off)
- [ ] Subheading visible and not truncated
- [ ] "Why Zintra" section displays below hero
- [ ] No horizontal scroll needed

#### Navigation
- [ ] All links are clickable (tap targets min 44x44px)
- [ ] No links are hidden behind other elements
- [ ] Menu is accessible on small screens
- [ ] Breadcrumbs work correctly (if present)

#### Footer & Bottom CTAs
- [ ] Footer links are accessible (44px+ targets)
- [ ] Contact info is visible
- [ ] No links cut off at bottom

---

### B. Search Form Testing

#### Form Inputs
- [ ] Role/Skill input is touch-friendly (min 44px height)
- [ ] Location input is touch-friendly
- [ ] Keyboard appears correctly on focus
- [ ] Keyboard doesn't hide input field
- [ ] Placeholder text is visible
- [ ] Label text is readable

#### Form Layout
- [ ] Jobs/Gigs toggle buttons are easy to tap
- [ ] Button minimum size: 44x44px ✓
- [ ] Search button is prominent
- [ ] Search button has sufficient padding
- [ ] Form doesn't scroll horizontally

#### Form Functionality
- [ ] Can type in Role field
- [ ] Can type in Location field
- [ ] Toggle between Jobs/Gigs works
- [ ] Submit button triggers search
- [ ] Form validation works (if any)
- [ ] Error messages display properly

---

### C. Text & Readability

#### Font Size
- [ ] Heading 1 (Hero) is readable (min 16px effective)
- [ ] Heading 2 is readable (min 14px effective)
- [ ] Body text is readable (min 12px effective)
- [ ] No text smaller than 12px for body content
- [ ] Links are visually distinct
- [ ] Button text is clear

#### Contrast
- [ ] Text contrast meets minimum 4.5:1 for normal text
- [ ] Text contrast meets minimum 3:1 for large text
- [ ] Links are distinguishable from body text
- [ ] Hover states are visible

#### Line Length
- [ ] Lines aren't too long (< 80 characters ideal)
- [ ] Text wraps correctly on narrow screens
- [ ] No words are cut off mid-word

---

### D. Button & Touch Targets

#### Button Size
- [ ] Primary buttons are 44x44px minimum
- [ ] Secondary buttons are 44x44px minimum
- [ ] Search button is large and prominent
- [ ] Call-to-action buttons are easily tappable
- [ ] No buttons smaller than 40px

#### Button Spacing
- [ ] Buttons have 8px padding from edges
- [ ] Buttons aren't too close together (min 8px gap)
- [ ] No button overlap
- [ ] Accidental touches don't trigger wrong button

#### Button Functionality
- [ ] All buttons respond to touch
- [ ] Buttons have visual feedback (highlight/ripple)
- [ ] Button states are clear (normal, hover, active, disabled)

---

### E. Images & Media

#### Image Loading
- [ ] Hero images load properly
- [ ] Employer logos load on mobile
- [ ] Worker avatars load correctly
- [ ] No broken image placeholders
- [ ] Images don't stretch or distort
- [ ] SVGs render correctly

#### Image Performance
- [ ] Images load within 2 seconds
- [ ] No flickering while loading
- [ ] Placeholder shows while loading (if implemented)
- [ ] Alt text displays if image fails

#### Responsive Images
- [ ] Images scale appropriately for screen size
- [ ] No oversized images causing slow load
- [ ] Images crop correctly on mobile (aspect ratio maintained)

---

### F. Scroll & Performance

#### Scrolling
- [ ] Page scrolls smoothly (60fps, no janky animation)
- [ ] No lag when scrolling through jobs
- [ ] Pull-to-refresh doesn't interfere (if applicable)
- [ ] Animations are smooth and not choppy

#### Performance Metrics
- [ ] Page loads in under 3 seconds (target: < 2s)
- [ ] Interactions respond instantly (< 100ms)
- [ ] No long tasks blocking UI (> 50ms)
- [ ] Smooth scrolling (60 FPS)

#### Memory Usage
- [ ] No crashes when scrolling long lists
- [ ] App doesn't consume excessive battery
- [ ] No memory leaks visible

---

### G. Forms & Input

#### Input Fields
- [ ] Inputs are at least 44px tall
- [ ] Sufficient padding inside inputs (min 8px)
- [ ] Font size is at least 16px (prevents zoom)
- [ ] Cursor is visible
- [ ] Placeholder text is distinguishable

#### Keyboard
- [ ] Correct keyboard type shows (text, number, email, etc.)
- [ ] Keyboard doesn't permanently hide input
- [ ] "Done" or "Search" button on keyboard works
- [ ] No need to scroll to see top of form while keyboard is open

#### Input Validation
- [ ] Error messages are visible
- [ ] Error messages don't overlap inputs
- [ ] Success messages appear (if applicable)
- [ ] Required field indicators are clear

---

### H. Tap Targets & Clickability

#### Link Targets
- [ ] All links are at least 44x44px
- [ ] Links in lists have adequate spacing
- [ ] Links are not adjacent to other tappable elements
- [ ] No overlapping touch targets
- [ ] Links respond within 100ms of tap

#### Tap Accuracy
- [ ] Can tap top of screen without difficulty
- [ ] Can tap bottom of screen without difficulty
- [ ] Accidental touches don't cause issues
- [ ] No keyboard interference with tappable elements

---

### I. Orientation Testing

#### Portrait Mode
- [ ] All content visible without scrolling excessively
- [ ] Layout reflows correctly
- [ ] No elements cut off
- [ ] Form remains usable
- [ ] Images scale appropriately

#### Landscape Mode
- [ ] Content doesn't stretch awkwardly
- [ ] Navigation remains accessible
- [ ] Touch targets remain usable
- [ ] No horizontal scroll needed
- [ ] Layout adapts to wider screen

#### Orientation Switch
- [ ] Switching orientation doesn't lose data
- [ ] Form values persist during rotation
- [ ] No crash on orientation change

---

### J. Network Conditions

#### 4G LTE
- [ ] Page loads completely in under 3 seconds
- [ ] Images load progressively
- [ ] Search functionality works

#### 3G (Slow)
- [ ] Page is usable even if images haven't loaded
- [ ] Text content loads first
- [ ] Loading indicators are shown

#### Offline
- [ ] Meaningful error message displayed
- [ ] No blank page
- [ ] No silent failures

---

## 🔴 Critical Issues Found

### Issue Template:
```
**Issue #**: [1]
**Severity**: [Critical / High / Medium / Low]
**Device**: [iPhone 14 / Samsung Galaxy S23 / etc.]
**Screen Size**: [6.1" / 5.0" / etc.]
**Operating System**: [iOS 17.2 / Android 13 / etc.]
**Browser**: [Chrome / Safari / Firefox]
**Description**: [What's broken?]
**Steps to Reproduce**: 
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
**Expected Behavior**: [What should happen?]
**Actual Behavior**: [What actually happens?]
**Screenshots**: [Attach images if possible]
**Fix Priority**: [Week 1 / Week 2 / Nice to have]
```

### Issues Recorded:
[None yet - add during testing]

---

## 📊 Test Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Navigation & Layout | ? | ? | |
| Search Form | ? | ? | |
| Text & Readability | ? | ? | |
| Buttons & Touch Targets | ? | ? | |
| Images & Media | ? | ? | |
| Scroll & Performance | ? | ? | |
| Forms & Input | ? | ? | |
| Tap Targets | ? | ? | |
| Orientation | ? | ? | |
| Network Conditions | ? | ? | |
| **TOTAL** | ? | ? | |

---

## ✅ Sign-Off

- **Tested By**: _________________
- **Date**: _________________
- **Device Coverage**: ___/15 devices tested
- **Overall Status**: [ ] PASS [ ] FAIL [ ] NEEDS FIXES

---

## 🎯 Success Criteria

Page passes mobile testing if:
- ✅ All critical issues fixed
- ✅ All form inputs are touch-friendly (44x44px min)
- ✅ No horizontal scroll on any screen size
- ✅ Page loads in under 3 seconds
- ✅ Text is readable without zoom
- ✅ All buttons respond within 100ms
- ✅ Smooth scrolling (60 FPS)
- ✅ No broken images
- ✅ Orientation switching works
- ✅ Works on both iOS and Android

---

## 📝 Notes & Observations

```
[Add any additional observations here]
```

---

**Document Version**: 1.0  
**Created**: 28 January 2026  
**Last Updated**: [Today's date]
