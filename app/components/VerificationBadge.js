'use client';

import React from 'react';
import { CheckCircle2, Shield, ShieldCheck, Award } from 'lucide-react';

/**
 * Premium Verification Badge Component
 * Displays unique, animated verification badges for vendors
 * 
 * @param {string} type - Badge type: 'business' | 'premium' | 'enterprise'
 * @param {string} size - Size: 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} showLabel - Show "Verified" label
 * @param {boolean} animated - Enable hover animations
 * @param {string} className - Additional CSS classes
 */
export function VerificationBadge({ 
  type = 'business', 
  size = 'md', 
  showLabel = false,
  animated = true,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const badgeConfig = {
    business: {
      icon: ShieldCheck,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      shadowColor: 'shadow-blue-500/50',
      ringColor: 'ring-blue-400/30',
      label: 'Verified Business',
      glowColor: 'bg-blue-400/20',
    },
    premium: {
      icon: Award,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      shadowColor: 'shadow-purple-500/50',
      ringColor: 'ring-purple-400/30',
      label: 'Premium Verified',
      glowColor: 'bg-purple-400/20',
    },
    enterprise: {
      icon: Shield,
      gradient: 'from-amber-500 via-yellow-500 to-orange-600',
      shadowColor: 'shadow-amber-500/50',
      ringColor: 'ring-amber-400/30',
      label: 'Enterprise Verified',
      glowColor: 'bg-amber-400/20',
    }
  };

  const config = badgeConfig[type] || badgeConfig.business;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Premium Badge with Gradient, Shadow and Animation */}
      <div className="relative group">
        {/* Animated Glow Effect */}
        {animated && (
          <div 
            className={`absolute inset-0 ${config.glowColor} rounded-full blur-md 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
              animate-pulse`}
            style={{ transform: 'scale(1.5)' }}
          />
        )}
        
        {/* Outer Ring (Subtle) */}
        <div 
          className={`absolute inset-0 rounded-full ring-2 ${config.ringColor} 
            ${animated ? 'group-hover:ring-4 group-hover:scale-110' : ''} 
            transition-all duration-300`}
        />
        
        {/* Main Badge */}
        <div 
          className={`
            relative ${sizeClasses[size]} rounded-full 
            bg-gradient-to-br ${config.gradient}
            shadow-lg ${config.shadowColor}
            flex items-center justify-center
            ${animated ? 'group-hover:scale-110 group-hover:rotate-6' : ''}
            transition-all duration-300
            ring-2 ring-white/20
          `}
        >
          <Icon 
            className={`
              ${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-5 h-5'}
              text-white drop-shadow-md
            `}
            strokeWidth={2.5}
          />
          
          {/* Inner Shine Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent opacity-50" />
        </div>

        {/* Sparkle Effects (for extra premium feel) */}
        {animated && size !== 'sm' && (
          <>
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-150" />
          </>
        )}
      </div>

      {/* Optional Label */}
      {showLabel && (
        <span 
          className={`
            ${labelSizeClasses[size]} font-semibold
            bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent
            ${animated ? 'group-hover:scale-105' : ''}
            transition-transform duration-300
          `}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Verification Badge with Tooltip
 * Displays badge with informative tooltip on hover
 */
export function VerificationBadgeWithTooltip({ type = 'business', size = 'md', className = '' }) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const tooltipMessages = {
    business: 'This business has been verified with official documents',
    premium: 'Premium verified business with enhanced credibility',
    enterprise: 'Enterprise-level verified organization'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <VerificationBadge type={type} size={size} animated={true} className={className} />
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap animate-fadeIn">
          {tooltipMessages[type]}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Large Verification Status Card
 * For vendor profile pages - shows full verification status
 */
export function VerificationStatusCard({ isVerified, verificationStatus, verifiedAt, className = '' }) {
  if (!isVerified) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">Not Verified</h4>
            <p className="text-xs text-amber-700 mt-1">
              This vendor has not submitted verification documents. Exercise caution when engaging.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <VerificationBadge type="business" size="xl" animated={false} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">Verified Business</h4>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Business documents verified on {new Date(verifiedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This vendor has submitted official business registration documents that have been reviewed and approved by our team.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Badge for Lists and Cards
 * Compact version for vendor cards in browse pages
 */
export function VerificationMini({ isVerified, className = '' }) {
  if (!isVerified) return null;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full border border-blue-200 ${className}`}>
      <VerificationBadge type="business" size="sm" animated={false} />
      <span className="text-xs font-medium text-blue-700">Verified</span>
    </div>
  );
}
