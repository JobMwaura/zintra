/**
 * /pages/api/vendors/by-jobtype.js
 * 
 * Get available vendors for a specific job type
 * 
 * FEATURES:
 * - Filter vendors by job type expertise
 * - Return vendor details (name, rating, location, contact)
 * - Sorting by rating/availability
 * - Caching for performance
 * 
 * QUERY PARAMS:
 * - jobType: string (required) - job type slug
 * - limit: number (optional) - max vendors to return (default: 20)
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   vendors: [
 *     {
 *       id: "vendor-uuid",
 *       name: "ABC Construction",
 *       rating: 4.8,
 *       totalReviews: 127,
 *       location: "Nairobi",
 *       description: "Specialist in residential construction",
 *       availableJobs: ["arch_new_residential", "arch_renovation", ...],
 *       responseTime: "< 4 hours",
 *       completedProjects: 156
 *     },
 *     ...
 *   ]
 * }
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { jobType, limit = 20 } = req.query;

  // Validate input
  if (!jobType || typeof jobType !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'jobType query parameter is required',
    });
  }

  try {
    // For now, return mock vendors
    // In production, query your database
    const mockVendors = [
      {
        id: 'vendor-001',
        name: 'ABC Construction Ltd',
        rating: 4.8,
        totalReviews: 127,
        location: 'Nairobi, Kenya',
        description: 'Specialists in residential and commercial construction with 15+ years experience',
        availableJobs: ['arch_new_residential', 'arch_renovation', 'arch_commercial'],
        responseTime: '< 4 hours',
        completedProjects: 156,
      },
      {
        id: 'vendor-002',
        name: 'Premier Builders',
        rating: 4.7,
        totalReviews: 94,
        location: 'Nairobi, Kenya',
        description: 'High-quality builds with on-time delivery guaranteed',
        availableJobs: ['arch_new_residential', 'arch_new_commercial'],
        responseTime: '< 2 hours',
        completedProjects: 89,
      },
      {
        id: 'vendor-003',
        name: 'Elite Construction Services',
        rating: 4.9,
        totalReviews: 203,
        location: 'Nairobi, Kenya',
        description: 'Award-winning construction firm specializing in premium projects',
        availableJobs: ['arch_commercial', 'arch_renovation', 'arch_new_residential'],
        responseTime: '< 8 hours',
        completedProjects: 312,
      },
      {
        id: 'vendor-004',
        name: 'BuildRight Construction',
        rating: 4.6,
        totalReviews: 78,
        location: 'Mombasa, Kenya',
        description: 'Trusted for quality and reliability in coastal projects',
        availableJobs: ['arch_new_residential', 'arch_renovation'],
        responseTime: '< 6 hours',
        completedProjects: 112,
      },
      {
        id: 'vendor-005',
        name: 'Vision Architecture & Build',
        rating: 4.8,
        totalReviews: 142,
        location: 'Nairobi, Kenya',
        description: 'Modern designs with sustainable building practices',
        availableJobs: ['arch_commercial', 'arch_new_residential'],
        responseTime: '< 3 hours',
        completedProjects: 198,
      },
    ];

    // Filter vendors by job type
    const filteredVendors = mockVendors
      .filter((vendor) => vendor.availableJobs.includes(jobType))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, parseInt(limit));

    // If no vendors found for this job type, return all vendors
    if (filteredVendors.length === 0) {
      return res.status(200).json({
        success: true,
        vendors: mockVendors
          .sort((a, b) => b.rating - a.rating)
          .slice(0, parseInt(limit)),
      });
    }

    return res.status(200).json({
      success: true,
      vendors: filteredVendors,
    });
  } catch (error) {
    console.error('Fetch vendors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
    });
  }
}
