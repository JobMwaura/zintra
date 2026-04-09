/**
 * Zintra Logo URLs - Hosted on AWS S3
 * These are optimized PNG versions for better performance and browser compatibility
 */

const S3_BASE_URL = 'https://zintra-images-prod.s3.us-east-1.amazonaws.com';

export const LOGO_URLS = {
  // Main Zintra logo with text (orange background, white Z + text)
  MAIN_LOGO: `${S3_BASE_URL}/logos/zintrass-new-logo.png`,
  
  // Admin dashboard logo (compact version)
  ADMIN_LOGO: `${S3_BASE_URL}/logos/logo.png`,
  
  // Vendor profile logo 
  VENDOR_LOGO: `${S3_BASE_URL}/logos/zintra-svg-logo.png`,
  
  // Favicon (square format for browser tabs)
  FAVICON: `${S3_BASE_URL}/logos/favicon.png`,
};

// Export individual URLs for convenience
export const MAIN_LOGO_URL = LOGO_URLS.MAIN_LOGO;
export const ADMIN_LOGO_URL = LOGO_URLS.ADMIN_LOGO;
export const VENDOR_LOGO_URL = LOGO_URLS.VENDOR_LOGO;
export const FAVICON_URL = LOGO_URLS.FAVICON;

export default LOGO_URLS;