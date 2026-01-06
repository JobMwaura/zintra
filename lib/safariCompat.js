'use client';

/**
 * Safari Compatibility Utilities
 * Handles Safari-specific issues with localStorage, session storage, and async operations
 */

/**
 * Safely get item from localStorage
 * Handles Safari private mode where localStorage throws
 */
export function safeGetFromStorage(key, defaultValue = null) {
  try {
    // Test if localStorage is accessible
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    // If we got here, localStorage is accessible
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn('⚠️ localStorage not accessible:', e.message);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * Handles Safari private mode where localStorage throws
 */
export function safeSetToStorage(key, value) {
  try {
    // Test if localStorage is accessible
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    // If we got here, localStorage is accessible
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage not accessible:', e.message);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
export function safeRemoveFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage not accessible:', e.message);
    return false;
  }
}

/**
 * Check if we're in Safari browser
 */
export function isSafari() {
  return typeof window !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}

/**
 * Check if we're in Safari private mode
 * (where localStorage is not available)
 */
export function isSafariPrivateMode() {
  try {
    const test = '__safari_private_mode_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Enhanced Promise.race that works better with Safari
 * Safari sometimes has issues with Promise.race timing
 */
export function promiseRaceWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
}

/**
 * Retry logic for Safari, which sometimes needs a second attempt
 */
export async function retryOperation(operation, maxRetries = 2, delayMs = 100) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
