'use client';

import { Shield, TrendingUp, Award, Crown, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ============================================
// LEVEL BADGE — Shows worker level (New / Rising / Trusted / Top Rated)
// ============================================

const LEVEL_CONFIG = {
  new: {
    label: 'New',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Shield,
    dotColor: 'bg-gray-400',
  },
  rising: {
    label: 'Rising',
    color: 'bg-blue-50 text-blue-700 border-blue-300',
    icon: TrendingUp,
    dotColor: 'bg-blue-500',
  },
  trusted: {
    label: 'Trusted',
    color: 'bg-green-50 text-green-700 border-green-300',
    icon: Award,
    dotColor: 'bg-green-500',
  },
  top_rated: {
    label: 'Top Rated',
    color: 'bg-orange-50 text-orange-700 border-orange-400',
    icon: Crown,
    dotColor: 'bg-orange-500',
  },
};

/**
 * LevelBadge — Inline badge showing worker level.
 * @param {string} level - Worker level key (new, rising, trusted, top_rated)
 * @param {'sm'|'md'|'lg'} size - Badge size
 * @param {boolean} showIcon - Whether to show the icon
 */
export function LevelBadge({ level = 'new', size = 'sm', showIcon = true }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.new;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = { sm: 12, md: 14, lg: 16 };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

/**
 * LevelDot — Tiny colored dot indicating level (for compact cards).
 */
export function LevelDot({ level = 'new' }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.new;
  return (
    <span className="inline-flex items-center gap-1" title={config.label}>
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className="text-xs text-gray-500">{config.label}</span>
    </span>
  );
}

// ============================================
// VERIFICATION BADGES
// ============================================

/**
 * VerificationBadges — Shows ID / References / Certs verification status.
 * @param {boolean} verifiedId
 * @param {boolean} verifiedReferences
 * @param {boolean} toolsReady - mapped to "Certificates" in UI
 * @param {'compact'|'full'} variant
 */
export function VerificationBadges({ verifiedId = false, verifiedReferences = false, toolsReady = false, variant = 'compact' }) {
  const badges = [
    { key: 'id', label: 'ID Verified', verified: verifiedId },
    { key: 'refs', label: 'References', verified: verifiedReferences },
    { key: 'certs', label: 'Certificates', verified: toolsReady },
  ];

  const verifiedCount = badges.filter(b => b.verified).length;

  if (variant === 'compact') {
    if (verifiedCount === 0) return null;
    return (
      <div className="flex items-center gap-1">
        {badges.filter(b => b.verified).map(b => (
          <span
            key={b.key}
            className="inline-flex items-center gap-0.5 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
            title={b.label}
          >
            <CheckCircle2 size={10} />
            {b.label.split(' ')[0]}
          </span>
        ))}
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-2">
      {badges.map(b => (
        <div key={b.key} className="flex items-center gap-2">
          {b.verified ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-gray-300" />
          )}
          <span className={`text-sm ${b.verified ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * VerificationStatusPill — Shows status for a single verification item.
 * @param {'pending'|'approved'|'rejected'|null} status
 */
export function VerificationStatusPill({ status }) {
  if (!status || status === 'none') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        Not submitted
      </span>
    );
  }

  const config = {
    pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending Review' },
    approved: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, label: 'Approved' },
    rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
  };

  const c = config[status] || config.pending;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${c.color}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

/**
 * FeaturedBadge — Shows "Featured" ribbon/badge on worker cards.
 */
export function FeaturedBadge({ size = 'sm' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full ${sizeClasses[size]}`}>
      <Crown size={size === 'sm' ? 10 : 14} />
      Featured
    </span>
  );
}
