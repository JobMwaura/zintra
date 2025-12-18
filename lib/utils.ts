/**
 * Utility function to combine classnames conditionally
 * Simple alternative to clsx/classnames library
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes
    .filter((cls): cls is string => typeof cls === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format phone number to Kenya format (+254...)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If starts with 0, replace with 254
  if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  }

  // If already has 254, just ensure + prefix
  if (digits.startsWith('254')) {
    return `+${digits}`;
  }

  // If shorter (just 9-10 digits), assume Kenya
  if (digits.length <= 10) {
    return `+254${digits}`;
  }

  return `+${digits}`;
}

/**
 * Validate Kenya phone number
 */
export function isValidKenyaPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Kenya numbers: +254 followed by 9 digits (valid carriers: 7, 1)
  const regex = /^\+254[17]\d{8}$/;
  return regex.test(formatted);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Get readable error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Delay execution (for timeouts, etc)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
