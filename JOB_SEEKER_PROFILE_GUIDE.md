# 🎯 Job Seeker Profile System - Complete Guide

## Overview

The job seeker profile system allows workers to:
1. **Create their profile** with skills, experience, and certifications
2. **Showcase their expertise** to employers
3. **Build their professional brand** on Zintra
4. **Get discovered** through the talent directory

---

## 📋 User Journey

### 1. Sign Up as Job Seeker
- Navigate to `/careers/auth/role-selector`
- Select "Worker" / "Job Seeker" role
- Complete authentication

### 2. Create Profile
- Go to `/careers/profile`
- Fill in personal information:
  - Full name (required)
  - Email (required)
  - Phone number (optional)
  - Profile photo (recommended)

### 3. Add Professional Information
- **Primary Role**: e.g., Electrician, Carpenter, Plumber (required)
- **Location**: City/County where you're based
- **About You**: Short bio highlighting key strengths

### 4. Showcase Skills
- Add individual skills (e.g., "Electrical Wiring", "Safety Certification")
- Each skill appears as a tag on profile
- Easy to add/remove skills

### 5. Detail Experience
- Write comprehensive work experience
- Include past projects, achievements
- Describe what you specialize in

### 6. List Certifications
- Add professional certifications
- Safety certifications, trade licenses, etc.
- Verified credentials boost hiring chances

---

## 🔗 Page Routes

### For Job Seekers

| Route | Purpose | Features |
|-------|---------|----------|
| `/careers` | Main careers landing | Browse jobs, gigs, see top talent |
| `/careers/talent` | Talent directory | Search/filter workers by role |
| `/careers/talent/[id]` | Worker profile view | See detailed worker profile |
| `/careers/profile` | Create/edit profile | Build your profile |
| `/careers/jobs` | Job listings | Browse available jobs |
| `/careers/gigs` | Gig listings | Browse short-term gigs |

### For Employers

| Route | Purpose |
|-------|---------|
| `/careers/employers` | Employer directory |
| `/careers/employer/dashboard` | Manage jobs & applications |
| `/careers/employer/post-job` | Post new job |
| `/careers/post-gig` | Post new gig |

---

## 📄 Worker Profile Data Structure

### Database Schema (profiles table)

```javascript
{
  id: 'user-uuid',                    // User ID
  full_name: 'John Doe',              // Full name
  email: 'john@example.com',          // Email
  phone: '+254 700 000 000',          // Phone
  avatar_url: 'https://...',          // Profile photo URL
  role: 'Electrician',                // Primary role
  city: 'Nairobi',                    // Location
  bio: 'Expert electrician...',       // About section
  skills: 'Wiring, Safety, ...', // Comma-separated skills
  experience: 'Detailed experience...', // Work history
  certifications: 'License, ...', // Comma-separated certs
  account_type: 'worker',             // Always 'worker'
  average_rating: 4.8,                // Star rating
  ratings_count: 25,                  // Number of reviews
  created_at: '2026-01-28...',        // Profile creation date
  updated_at: '2026-01-28...',        // Last update date
}
```

---

## 🎨 Profile Pages

### 1. Create/Edit Profile (`/careers/profile`)

**Layout**: 3-column responsive
- **Left Column**: Avatar upload & preview
- **Center/Right Column**: Form fields

**Form Sections**:

#### Basic Information
- Full Name (required)
- Email (required)
- Phone Number (optional)

#### Professional Information
- Primary Role (required) - What's your main skill?
- City/County - Where are you located?
- About You - Your professional summary

#### Skills
- Add individual skills with + button
- Remove skills with X button
- Display as orange tags

#### Experience
- Multi-line textarea
- Describe projects, achievements, specialties
- Formatted with line breaks

#### Certifications
- Add certifications with + button
- Remove with X button
- Display as verified list items

#### Actions
- **Save Profile** button (blue, primary CTA)
- **Cancel** link (gray secondary)

---

### 2. View Worker Profile (`/careers/talent/[id]`)

**Layout**: 3-column responsive
- **Left Column**: Profile card (sticky)
- **Right Column**: Detailed information

**Left Card**:
- Avatar (image or initials)
- Name & Role (highlighted)
- Star rating & review count
- Contact info (location, email, phone)
- **Hire This Worker** button (orange, primary)
- **Edit Profile** link (gray, self-edit only)

**Right Column Sections**:
- **About**: Bio/tagline
- **Skills**: Tag list of skills
- **Experience**: Detailed work history
- **Certifications**: Verified list with checkmarks
- **Recent Reviews**: Last 10 reviews with ratings & comments

---

## 🏠 Careers Landing Page Updates

### TopRatedTalent Component

**Before**: 
- "View Profile" button was non-functional

**After**:
- Links to `/careers/talent/[worker.id]`
- Clickable worker cards
- Full profile accessible

---

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile** (< 768px): Single column, stacked layout
- **Tablet** (768px - 1024px): 2 columns
- **Desktop** (> 1024px): Full 3-column layout

### Mobile Optimizations
- Larger touch targets (buttons, inputs)
- Simplified avatar sizing
- Stacked form sections
- Full-width cards

---

## ✨ Key Features

### 1. Profile Completion Indicator
- Form shows required vs optional fields
- Clear visual hierarchy
- Progress tracking possible

### 2. Avatar Upload
- JPG, PNG, WebP supported
- Max 5MB file size
- Drag-and-drop support
- Real-time preview

### 3. Skill Management
- Add/remove skills dynamically
- Visual tag display
- No character limits

### 4. Profile Visibility
- Public profile accessible at `/careers/talent/[id]`
- Shows in talent directory
- Appears in "Top Rated" section
- Searchable by name & skills

### 5. Review System
- Shows recent reviews from employers
- Star ratings (1-5)
- Review comments
- Reviewer name & date

---

## 🔒 Security & Permissions

### Access Control
- **Create Profile**: Requires authentication, worker account type
- **Edit Profile**: Only user can edit their own profile
- **View Profile**: Public - anyone can view
- **Delete Profile**: Not implemented (archive instead)

### Data Validation
- Email: Required, valid format
- Phone: Optional, 10+ digits if provided
- File upload: Size limit 5MB, whitelist MIME types
- Skills/Certs: Trimmed, max 100 characters each

---

## 🚀 How to Use

### For Job Seekers

1. **Sign Up**
   - Click "Get Started" on homepage
   - Select "Worker" role
   - Complete email verification

2. **Create Profile**
   - Go to `/careers/profile`
   - Upload a professional photo
   - Fill in all required fields
   - Add skills & experience
   - Add certifications (optional)
   - Click "Save Profile"

3. **View Your Profile**
   - After saving, redirected to your profile
   - See how employers will see you
   - Edit anytime at `/careers/profile`

4. **Get Discovered**
   - Appear in `/careers/talent` directory
   - May appear in "Top Rated" section
   - Employers can find & contact you
   - Receive job/gig invitations

5. **Accept Gigs/Jobs**
   - Browse `/careers/gigs` or `/careers/jobs`
   - Apply to positions
   - Chat with employers
   - Complete work
   - Receive reviews & ratings

---

## 📊 Database Tables Used

### profiles
- Worker profile information
- Skills & certifications (stored as comma-separated)
- Avatar URL (from Supabase Storage)
- Ratings aggregates

### reviews
- Employer feedback on workers
- Star ratings (1-5)
- Review comments
- Linked to worker & gig

### applications
- Worker applications to jobs/gigs
- Application status (pending, accepted, rejected)
- Linked to listing & worker

### listings
- Job & gig postings
- Created by employers
- Has multiple applications

---

## 🎯 Future Enhancements

1. **Profile Verification**
   - Verify email & phone
   - Certificate uploads
   - ID verification for premium workers

2. **Portfolio Gallery**
   - Before/after project photos
   - Video portfolio
   - Work samples

3. **Background Checks**
   - Criminal background check
   - Reference verification
   - Work history validation

4. **Skills Endorsement**
   - Peer endorsements
   - Verified badges
   - Skill ratings separate from overall rating

5. **Profile Analytics**
   - Profile views count
   - Application response rate
   - Profile completion score

6. **Onboarding Flow**
   - Step-by-step profile builder
   - Progress tracking
   - Tips & best practices

---

## 🐛 Troubleshooting

### Profile Not Saving
- Check internet connection
- Ensure required fields filled
- Check browser console for errors
- Try clearing browser cache

### Avatar Not Uploading
- File must be < 5MB
- Format: JPG, PNG, or WebP
- Check Supabase storage permissions
- Verify bucket exists: `worker-avatars`

### Can't View Own Profile
- Click "Edit Profile" to go to profile form
- After saving, redirected to profile view
- Or manually navigate to `/careers/talent/[your-id]`

### Skills Not Saving
- Type skill & press Enter or click Add
- Ensure not leaving skill field blank
- Skills saved as comma-separated in DB

---

## 📝 Notes for Developers

### Component Files
- `app/careers/profile/page.js` - Create/edit profile
- `app/careers/talent/[id]/page.js` - View profile
- `components/careers/TopRatedTalent.js` - Worker cards

### Supabase Tables
```sql
-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT,
  city TEXT,
  bio TEXT,
  skills TEXT,
  experience TEXT,
  certifications TEXT,
  account_type TEXT DEFAULT 'worker',
  average_rating DECIMAL(3,1),
  ratings_count INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  worker_id UUID REFERENCES profiles(id),
  reviewer_id UUID REFERENCES profiles(id),
  rating INT (1-5),
  comment TEXT,
  created_at TIMESTAMP
);
```

### Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Status

- ✅ Create/Edit Profile Page: **Complete**
- ✅ View Worker Profile: **Complete**
- ✅ TopRatedTalent Links: **Complete**
- ✅ Avatar Upload: **Complete**
- ✅ Skills Management: **Complete**
- ✅ Review Display: **Complete**
- ⏳ Profile Verification: **Planned**
- ⏳ Portfolio Gallery: **Planned**

---

**Deployment**: Vercel (auto-deploys on commit)
**Last Updated**: 28 January 2026
**Commit**: c7cac4a
