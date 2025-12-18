/**
 * ============================================================================
 * BUYER REPUTATION BADGE COMPONENT
 * ============================================================================
 * Displays a compact badge showing buyer reputation tier and score
 * 
 * Props:
 * - tier: 'bronze' | 'silver' | 'gold' | 'platinum'
 * - score: number (0-100)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showLabel: boolean (default: true)
 * - showScore: boolean (default: true)
 * 
 * Usage:
 * <BuyerReputationBadge tier="gold" score={65} size="md" />
 * 
 * ============================================================================
 */

'use client';

import { Award, Star, Zap, Crown } from 'lucide-react';

const tierConfig = {
  bronze: {
    emoji: '🥉',
    label: 'Bronze',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    description: 'Starting reputation',
    range: '0-24 points'
  },
  silver: {
    emoji: '🥈',
    label: 'Silver',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    description: 'Good reputation',
    range: '25-49 points'
  },
  gold: {
    emoji: '🥇',
    label: 'Gold',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    description: 'Excellent reputation',
    range: '50-74 points'
  },
  platinum: {
    emoji: '👑',
    label: 'Platinum',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: 'Outstanding reputation',
    range: '75-100 points'
  }
};

export default function BuyerReputationBadge({
  tier = 'bronze',
  score = 0,
  size = 'md',
  showLabel = true,
  showScore = true
}) {
  const config = tierConfig[tier] || tierConfig.bronze;

  const sizeClasses = {
    sm: {
      badge: 'w-6 h-6',
      text: 'text-xs',
      container: 'px-2 py-1 gap-1'
    },
    md: {
      badge: 'w-8 h-8',
      text: 'text-sm',
      container: 'px-3 py-1.5 gap-2'
    },
    lg: {
      badge: 'w-10 h-10',
      text: 'text-base',
      container: 'px-4 py-2 gap-3'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center ${sizes.container} ${config.bgColor} rounded-full border ${config.borderColor}`}>
      {/* Badge Icon */}
      <div className={`flex-shrink-0 text-xl leading-none`}>
        {config.emoji}
      </div>

      {/* Text Content */}
      {(showLabel || showScore) && (
        <div className="flex-grow">
          {showLabel && (
            <p className={`font-semibold ${config.textColor} ${sizes.text} leading-none`}>
              {config.label}
            </p>
          )}
          {showScore && (
            <p className={`text-xs ${config.textColor} opacity-75 leading-none`}>
              {score}/100
            </p>
          )}
        </div>
      )}
    </div>
  );
}
