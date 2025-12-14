// File: lib/rateLimiter.js
// FIXED VERSION: Uses localStorage for persistence

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const STORAGE_KEY = 'admin_login_lockout';

export function checkRateLimit() {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) {
    return { allowed: true, attempts: 0, remainingTime: 0 };
  }

  const lockData = JSON.parse(stored);
  const now = Date.now();
  const elapsedTime = now - lockData.lockedAt;

  // Check if lock has expired
  if (elapsedTime > LOCK_TIME) {
    localStorage.removeItem(STORAGE_KEY);
    return { allowed: true, attempts: 0, remainingTime: 0 };
  }

  // Still locked
  const remainingTime = Math.ceil((LOCK_TIME - elapsedTime) / 1000);
  return {
    allowed: false,
    attempts: lockData.attempts,
    remainingTime: remainingTime
  };
}

export function recordFailedAttempt() {
  const stored = localStorage.getItem(STORAGE_KEY);
  let attempts = 1;
  let lockedAt = Date.now();

  if (stored) {
    const lockData = JSON.parse(stored);
    const now = Date.now();
    const elapsedTime = now - lockData.lockedAt;

    // Reset if lock expired
    if (elapsedTime > LOCK_TIME) {
      attempts = 1;
      lockedAt = Date.now();
    } else {
      attempts = lockData.attempts + 1;
      lockedAt = lockData.lockedAt;
    }
  }

  const lockData = {
    attempts,
    lockedAt,
    lockedUntil: lockedAt + LOCK_TIME
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lockData));

  // If 5+ attempts, lock immediately
  if (attempts >= MAX_ATTEMPTS) {
    console.log('🔒 LOCKED after', attempts, 'attempts');
    return { locked: true, attempts, remainingTime: LOCK_TIME / 1000 };
  }

  return { locked: false, attempts, remainingTime: 0 };
}

export function clearRateLimitRecord() {
  localStorage.removeItem(STORAGE_KEY);
}

// Helper to get remaining time
export function getRemainingLockTime() {
  const rateLimitCheck = checkRateLimit();
  return rateLimitCheck.remainingTime;
}