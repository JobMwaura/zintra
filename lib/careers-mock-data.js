/**
 * Mock data for Zintra Career Centre
 * TODO: Replace with API calls to /api/careers/*
 */

export const mockEmployers = [
  {
    id: 1,
    name: "Bridgelift Constructions",
    logo: "🏢",
    location: "Nairobi",
    verified: true,
    jobCount: 12,
  },
  {
    id: 2,
    name: "SafeBuild Ltd",
    logo: "🏗️",
    location: "Mombasa",
    verified: true,
    jobCount: 8,
  },
  {
    id: 3,
    name: "Urban Developers Co.",
    logo: "🏭",
    location: "Kisumu",
    verified: true,
    jobCount: 15,
  },
  {
    id: 4,
    name: "Elite Contractors",
    logo: "🔨",
    location: "Nairobi",
    verified: true,
    jobCount: 20,
  },
  {
    id: 5,
    name: "GreenBuild Kenya",
    logo: "🌱",
    location: "Nakuru",
    verified: true,
    jobCount: 10,
  },
  {
    id: 6,
    name: "Precision Engineering",
    logo: "⚙️",
    location: "Nairobi",
    verified: false,
    jobCount: 5,
  },
];

export const mockTrendingRoles = [
  "Mason",
  "Electrician",
  "Plumber",
  "Foreman",
  "QS (Quantity Surveyor)",
  "Site Engineer",
  "Carpenter",
  "Welder",
  "Heavy Equipment Operator",
  "Safety Officer",
];

export const mockGigs = [
  {
    id: 1,
    role: "Painter",
    location: "Westlands, Nairobi",
    duration: "3 days",
    pay: 3000,
    startDate: "2026-01-20",
    employer: "Bridgelift Constructions",
    applicants: 5,
  },
  {
    id: 2,
    role: "Electrician",
    location: "South B, Nairobi",
    duration: "1 week",
    pay: 5000,
    startDate: "2026-01-22",
    employer: "SafeBuild Ltd",
    applicants: 12,
  },
  {
    id: 3,
    role: "Mason",
    location: "Mombasa",
    duration: "2 weeks",
    pay: 4500,
    startDate: "2026-01-25",
    employer: "Urban Developers Co.",
    applicants: 8,
  },
  {
    id: 4,
    role: "Plumber",
    location: "Kisumu",
    duration: "4 days",
    pay: 3500,
    startDate: "2026-01-21",
    employer: "Elite Contractors",
    applicants: 3,
  },
];

export const mockTopRatedWorkers = [
  {
    id: 1,
    name: "James M.",
    initials: "JM",
    role: "Mason",
    county: "Nairobi",
    rating: 4.9,
    reviews: 127,
    toolsReady: true,
  },
  {
    id: 2,
    name: "Alice N.",
    initials: "AN",
    role: "Electrician",
    county: "Mombasa",
    rating: 4.8,
    reviews: 95,
    toolsReady: true,
  },
  {
    id: 3,
    name: "David K.",
    initials: "DK",
    role: "Plumber",
    county: "Nakuru",
    rating: 4.7,
    reviews: 82,
    toolsReady: false,
  },
  {
    id: 4,
    name: "Mercy W.",
    initials: "MW",
    role: "Carpenter",
    county: "Kisumu",
    rating: 4.9,
    reviews: 110,
    toolsReady: true,
  },
  {
    id: 5,
    name: "Peter M.",
    initials: "PM",
    role: "Site Engineer",
    county: "Nairobi",
    rating: 4.6,
    reviews: 65,
    toolsReady: true,
  },
  {
    id: 6,
    name: "Rose K.",
    initials: "RK",
    role: "Safety Officer",
    county: "Mombasa",
    rating: 4.8,
    reviews: 78,
    toolsReady: false,
  },
];

export const payRanges = [
  { value: "0-2000", label: "KES 0 - 2,000" },
  { value: "2000-5000", label: "KES 2,000 - 5,000" },
  { value: "5000-10000", label: "KES 5,000 - 10,000" },
  { value: "10000-20000", label: "KES 10,000 - 20,000" },
  { value: "20000+", label: "KES 20,000+" },
];

export const howItWorksWorkers = [
  {
    step: 1,
    title: "Create Your Profile",
    description: "Sign up, add your skills, and showcase your experience.",
  },
  {
    step: 2,
    title: "Browse & Apply",
    description: "Find jobs and gigs that match your skills and location.",
  },
  {
    step: 3,
    title: "Get Hired & Earn",
    description: "Secure messaging, clear pay terms, and quick payments.",
  },
];

export const howItWorksEmployers = [
  {
    step: 1,
    title: "Post a Job or Gig",
    description: "Describe your project and required skills. Get verified instantly.",
  },
  {
    step: 2,
    title: "Find Your Team",
    description: "Review profiles, ratings, and applications from vetted workers.",
  },
  {
    step: 3,
    title: "Manage & Communicate",
    description: "Secure messaging, clear timelines, and flexible payment options.",
  },
];

export const trustItems = [
  {
    id: 1,
    icon: "✓",
    title: "Verified Employers",
    description: "All employers are identity-verified for your safety.",
  },
  {
    id: 2,
    icon: "🛡️",
    title: "Anti-Scam Checks",
    description: "We monitor and protect against fraudulent listings.",
  },
  {
    id: 3,
    icon: "💬",
    title: "Secure Messaging",
    description: "In-app messaging keeps your contact info private.",
  },
  {
    id: 4,
    icon: "💰",
    title: "Clear Pay Ranges",
    description: "Know exactly what you'll earn before you apply.",
  },
];
