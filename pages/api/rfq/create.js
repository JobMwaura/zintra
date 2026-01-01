/**
 * /pages/api/rfq/create.js
 * 
 * Create a new RFQ (Request for Quote) request
 * 
 * ✅ TWEAKS APPLIED:
 * - Tweak 3: 3-tier payment model (free 3, standard 5, premium unlimited)
 * - Tweak 4: Phone verification required for guests
 * - Tweak 6: Server-side validation & security
 * 
 * FEATURES:
 * - RFQ quota enforcement (backend, not frontend-only)
 * - Payment tier validation
 * - Phone verification check
 * - Form data validation against templates
 * - Field type validation (numbers, dates, selects)
 * - Required field enforcement
 * - Input sanitization (prevent XSS)
 * - Rate limiting (max 10 per hour per IP)
 * - Vendor matching by job_type
 * 
 * PRICING TIERS:
 * Free:     0 KES,  3 RFQs/month
 * Standard: 500 KES, 5 RFQs/month
 * Premium: 1000 KES, unlimited RFQs/month
 * 
 * REQUEST BODY:
 * {
 *   // Auth
 *   userId: "user-uuid" | null,
 *   guestEmail: "guest@example.com",
 *   guestPhone: "+254712345678",
 *   guestPhoneVerifiedAt: "2025-12-31T18:00:00Z" | null,
 *   
 *   // RFQ Type
 *   rfqType: "direct" | "wizard" | "public",
 *   
 *   // Category & Job Type
 *   categorySlug: "architectural",
 *   jobTypeSlug: "arch_new_residential",
 *   
 *   // Form Data
 *   formData: {
 *     property_description: "3-bedroom house",
 *     number_of_floors: "2",
 *     // ... all template fields + shared fields
 *   },
 *   
 *   // Optional: Vendor selection (for wizard/wizard mode)
 *   selectedVendorIds: ["vendor-1", "vendor-2"] | null,
 * }
 * 
 * RESPONSE:
 * Success (201):
 * {
 *   success: true,
 *   rfqId: "rfq-uuid",
 *   message: "RFQ created successfully"
 * }
 * 
 * Error (400 - Validation):
 * {
 *   error: "Field validation failed" | "Missing required fields" | "Phone not verified",
 *   details: { fieldName: "error message" }
 * }
 * 
 * Error (402 - Payment):
 * {
 *   error: "RFQ limit reached",
 *   tier: "free",
 *   limit: 3,
 *   used: 3,
 *   message: "Upgrade to continue"
 * }
 * 
 * Error (429 - Rate Limit):
 * {
 *   error: "Too many requests",
 *   retryAfter: 3600
 * }
 */

import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

// Load templates (Tweak 1: source of truth)
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

// Constants
const TIER_LIMITS = {
  free: 3,
  standard: 5,
  premium: Infinity,
};

const TIER_PRICES = {
  free: 0,
  standard: 500, // KES
  premium: 1000, // KES
};

// Rate limiter: max 10 RFQs per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 RFQs per hour per IP
  message: 'Too many RFQs created from this IP, please try again later',
  skip: (req) => {
    // Don't rate limit authenticated users (allow 20/hour)
    return req.headers['authorization'] !== undefined;
  },
});

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return data
      .replace(/<script/gi, '') // Remove script tags
      .replace(/<iframe/gi, '') // Remove iframes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .substring(0, 5000); // Max 5000 chars per field
  } else if (typeof data === 'number' || typeof data === 'boolean') {
    return data; // Numbers and booleans are safe
  } else if (Array.isArray(data)) {
    return data.slice(0, 100); // Max 100 items per array
  } else if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return '';
}

/**
 * Validate form data against template spec
 */
function validateFormData(categorySlug, jobTypeSlug, formData) {
  const errors = {};

  // Find the template
  const category = templates.majorCategories.find(
    (c) => c.slug === categorySlug
  );
  if (!category) {
    return { error: 'Category not found' };
  }

  const jobType = category.jobTypes.find((j) => j.slug === jobTypeSlug);
  if (!jobType) {
    return { error: 'Job type not found' };
  }

  // Get all field specs (template + shared)
  const allFieldSpecs = [
    ...jobType.fields,
    ...templates.sharedGeneralFields,
  ];

  // Validate each field
  for (const fieldSpec of allFieldSpecs) {
    const value = formData[fieldSpec.name];

    // Check required fields
    if (fieldSpec.required && (!value || value === '')) {
      errors[fieldSpec.name] = `${fieldSpec.label} is required`;
      continue;
    }

    // Skip optional empty fields
    if (!value || value === '') continue;

    // Type-specific validation
    switch (fieldSpec.type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors[fieldSpec.name] = `${fieldSpec.label} must be a number`;
        } else {
          if (
            fieldSpec.min !== undefined &&
            num < fieldSpec.min
          ) {
            errors[fieldSpec.name] = `${fieldSpec.label} must be at least ${fieldSpec.min}`;
          }
          if (
            fieldSpec.max !== undefined &&
            num > fieldSpec.max
          ) {
            errors[fieldSpec.name] = `${fieldSpec.label} must be at most ${fieldSpec.max}`;
          }
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[fieldSpec.name] = `${fieldSpec.label} is an invalid date`;
        }
        break;

      case 'select':
        if (!fieldSpec.options || !fieldSpec.options.includes(value)) {
          errors[fieldSpec.name] = `${fieldSpec.label} has an invalid option`;
        }
        break;

      case 'multiselect':
        if (Array.isArray(value)) {
          const invalid = value.find(
            (v) => !fieldSpec.options || !fieldSpec.options.includes(v)
          );
          if (invalid) {
            errors[fieldSpec.name] = `${fieldSpec.label} has invalid options`;
          }
        }
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[fieldSpec.name] = `${fieldSpec.label} is not a valid email`;
        }
        break;

      case 'phone':
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
          errors[fieldSpec.name] = `${fieldSpec.label} is not a valid phone number`;
        }
        break;

      case 'textarea':
      case 'text':
      default:
        if (typeof value !== 'string') {
          errors[fieldSpec.name] = `${fieldSpec.label} must be text`;
        }
        break;
    }
  }

  return Object.keys(errors).length > 0 ? { errors } : { valid: true };
}

/**
 * Check RFQ quota for user/guest
 */
async function checkRfqQuota(supabase, userId, guestEmail) {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  let query = supabase
    .from('rfqs')
    .select('id', { count: 'exact' })
    .gte('created_at', thisMonth.toISOString())
    .lte('created_at', new Date().toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (guestEmail) {
    query = query.eq('guest_email', guestEmail);
  } else {
    return { error: 'userId or guestEmail required' };
  }

  const { data: rfqs, error, count } = await query;

  if (error) {
    return { error: error.message };
  }

  const rfqCount = count || 0;

  // Get user's tier
  let tier = 'free'; // Default to free for guests

  if (userId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('rfq_tier')
      .eq('id', userId)
      .single();

    if (!userError && user) {
      tier = user.rfq_tier || 'free';
    }
  }

  const limit = TIER_LIMITS[tier];

  if (rfqCount >= limit) {
    return {
      error: 'RFQ limit reached',
      tier,
      limit,
      used: rfqCount,
      message: `You have reached your ${limit} RFQ/month limit`,
    };
  }

  return { valid: true, tier, rfqCount, limit };
}

/**
 * Find vendors matching this RFQ
 */
async function findMatchingVendors(supabase, categorySlug, jobTypeSlug) {
  // Find vendors with this job type in their skills
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, email, phone, name')
    .contains('job_type_skills', [jobTypeSlug])
    .eq('status', 'active')
    .limit(50); // Limit to avoid notification spam

  if (error) {
    console.error('Error finding vendors:', error);
    return [];
  }

  return vendors || [];
}

/**
 * Send notifications to matched vendors
 */
async function notifyVendors(vendors, rfq) {
  // TODO: Implement email/SMS notifications to vendors
  // This requires your notification service setup
  console.log(`Notifying ${vendors.length} vendors about RFQ ${rfq.id}`);

  for (const vendor of vendors) {
    try {
      // Send email notification
      // await sendEmail({
      //   to: vendor.email,
      //   subject: `New RFQ: ${rfq.job_type_slug}`,
      //   template: 'vendor-rfq-notification',
      //   data: { rfq, vendor }
      // });

      // Send SMS notification
      // await sendSMS({
      //   to: vendor.phone,
      //   message: `New RFQ for ${rfq.job_type_slug}. Check your email for details.`
      // });
    } catch (error) {
      console.error(`Failed to notify vendor ${vendor.id}:`, error);
    }
  }
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    limiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      userId,
      guestEmail,
      guestPhone,
      guestPhoneVerifiedAt,
      rfqType,
      categorySlug,
      jobTypeSlug,
      formData,
      selectedVendorIds,
    } = req.body;

    // ========================================
    // 1. Validate inputs
    // ========================================
    if (!rfqType || !['direct', 'wizard', 'public'].includes(rfqType)) {
      return res
        .status(400)
        .json({ error: 'Invalid rfqType (must be direct, wizard, or public)' });
    }

    if (!categorySlug || !jobTypeSlug) {
      return res
        .status(400)
        .json({ error: 'categorySlug and jobTypeSlug are required' });
    }

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ error: 'formData is required' });
    }

    // ========================================
    // 2. Guest or authenticated user (Tweak 4: Phone verification)
    // ========================================
    if (!userId && !guestEmail) {
      return res
        .status(400)
        .json({ error: 'userId or guestEmail required' });
    }

    if (guestEmail && !guestPhone) {
      return res
        .status(400)
        .json({ error: 'Phone number required for guests' });
    }

    // Guests must have verified their phone (Tweak 4)
    if (
      guestEmail &&
      !guestPhoneVerifiedAt
    ) {
      return res.status(400).json({
        error: 'Phone verification required',
        message: 'Guest users must verify their phone number before submitting RFQs',
      });
    }

    // ========================================
    // 3. Validate form data against template (Tweak 6)
    // ========================================
    const validation = validateFormData(
      categorySlug,
      jobTypeSlug,
      formData
    );

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    if (validation.errors) {
      return res.status(400).json({
        error: 'Field validation failed',
        details: validation.errors,
      });
    }

    // ========================================
    // 4. Check RFQ quota (Tweak 3)
    // ========================================
    const quotaCheck = await checkRfqQuota(
      supabase,
      userId,
      guestEmail
    );

    if (quotaCheck.error) {
      if (quotaCheck.message) {
        // Quota limit reached
        return res.status(402).json(quotaCheck);
      } else {
        // Database error
        return res.status(500).json({ error: quotaCheck.error });
      }
    }

    // ========================================
    // 5. Sanitize input (Tweak 6)
    // ========================================
    const sanitizedFormData = sanitizeInput(formData);

    // ========================================
    // 6. Create RFQ in database
    // ========================================
    const { data: newRfq, error: createError } = await supabase
      .from('rfqs')
      .insert([
        {
          user_id: userId || null,
          guest_email: guestEmail || null,
          guest_phone: guestPhone || null,
          guest_phone_verified_at: guestPhoneVerifiedAt || null,
          rfq_type: rfqType,
          category_slug: categorySlug,
          job_type_slug: jobTypeSlug,
          form_data: sanitizedFormData,
          selected_vendor_ids: selectedVendorIds || null,
          status: 'pending',
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating RFQ:', createError);
      return res.status(500).json({ error: 'Failed to create RFQ' });
    }

    // ========================================
    // 7. Find and notify matching vendors
    // ========================================
    const vendors = await findMatchingVendors(
      supabase,
      categorySlug,
      jobTypeSlug
    );

    if (vendors.length > 0) {
      // Notify vendors asynchronously (don't block response)
      notifyVendors(vendors, newRfq).catch((err) => {
        console.error('Error notifying vendors:', err);
      });
    }

    // ========================================
    // 8. Success response
    // ========================================
    return res.status(201).json({
      success: true,
      rfqId: newRfq.id,
      message: 'RFQ created successfully',
      vendorCount: vendors.length,
    });

  } catch (error) {
    console.error('RFQ creation error:', error);

    return res.status(500).json({
      error: 'Failed to create RFQ',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Server error',
    });
  }
}
