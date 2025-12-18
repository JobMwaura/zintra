/**
 * ============================================================================
 * REPUTATION TIER COMPONENT
 * ============================================================================
 * Displays reputation tier information with visual hierarchy
 * 
 * Props:
 * - currentScore: number (0-100, default: 0)
 * - showDescription: boolean (default: true)
 * - interactive: boolean (default: false)
 * 
 * Features:
 * - Visual tier cards
 * - Current tier highlighting
 * - Progress indicators
 * - Detailed descriptions
 * 
 * Usage:
 * <ReputationTier currentScore={65} showDescription={true} />
 * 
 * ============================================================================
 */

'use client';

import { Award, Star, Zap, Crown } from 'lucide-react';

const tierData = [
  {
    name: 'Bronze',
    emoji: '🥉',
    range: '0-24',
    min: 0,
    max: 24,
    icon: Award,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Starting buyer with developing reputation. Build your profile by completing RFQs and selecting vendors.'
  },
  {
    name: 'Silver',
    emoji: '🥈',
    range: '25-49',
    min: 25,
    max: 49,
    icon: Star,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    description: 'Established buyer with good track record. Vendors recognize your consistent engagement.'
  },
  {
    name: 'Gold',
    emoji: '🥇',
    range: '50-74',
    min: 50,
    max: 74,
    icon: Zap,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    description: 'Excellent buyer with strong reputation. Vendors prioritize your RFQs and offers.'
  },
  {
    name: 'Platinum',
    emoji: '👑',
    range: '75-100',
    min: 75,
    max: 100,
    icon: Crown,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Outstanding buyer with exceptional reputation. Premium status with top vendor access.'
  }
];

export default function ReputationTier({
  currentScore = 0,
  showDescription = true,
  interactive = false
}) {
  const currentTier = tierData.find(t => currentScore >= t.min && currentScore <= t.max) || tierData[0];

  const getProgressToNextTier = () => {
    if (currentScore < 25) {
      return { current: currentScore, total: 25, percentage: (currentScore / 25) * 100, next: 'Silver' };
    }
    if (currentScore < 50) {
      return { current: currentScore - 25, total: 25, percentage: ((currentScore - 25) / 25) * 100, next: 'Gold' };
    }
    if (currentScore < 75) {
      return { current: currentScore - 50, total: 25, percentage: ((currentScore - 50) / 25) * 100, next: 'Platinum' };
    }
    return { current: currentScore - 75, total: 25, percentage: ((currentScore - 75) / 25) * 100, next: 'Maximum' };
  };

  const progress = getProgressToNextTier();

  return (
    <div className="space-y-6">
      {/* Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tierData.map((tier) => {
          const Icon = tier.icon;
          const isCurrentTier = currentScore >= tier.min && currentScore <= tier.max;

          return (
            <div
              key={tier.name}
              className={`
                relative ${tier.bgColor} border-2 ${tier.borderColor} rounded-lg p-5
                transition-all duration-200
                ${isCurrentTier ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : 'shadow'}
                ${interactive ? 'hover:shadow-md cursor-pointer' : ''}
              `}
            >
              {/* Current Tier Badge */}
              {isCurrentTier && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                  YOUR TIER
                </div>
              )}

              {/* Tier Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{tier.emoji}</div>
                <div className="flex-1">
                  <h4 className={`font-bold text-lg ${tier.textColor}`}>{tier.name}</h4>
                  <p className="text-xs text-gray-600">{tier.range} points</p>
                </div>
              </div>

              {/* Description */}
              {showDescription && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {tier.description}
                </p>
              )}

              {/* Progress Indicator for Current Tier */}
              {isCurrentTier && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">Progress</span>
                    <span className="text-xs font-bold text-gray-900">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Position Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 shadow-sm">
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Your Current Score</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl">{currentTier.emoji}</span>
                <div>
                  <p className={`text-2xl font-bold ${currentTier.textColor}`}>
                    {currentTier.name}
                  </p>
                  <p className="text-sm text-gray-600">{currentScore}/100 points</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Overall Progress</span>
              <span className="text-xs text-gray-600">
                {currentScore < 75 ? `${75 - currentScore} points to Platinum` : 'Maximum achieved'}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-blue-600 transition-all duration-500"
                style={{ width: `${Math.min((currentScore / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Bronze (0)</span>
              <span>Silver (25)</span>
              <span>Gold (50)</span>
              <span>Platinum (75)</span>
              <span>Max (100)</span>
            </div>
          </div>

          {/* Next Milestone */}
          {currentScore < 100 && (
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium">NEXT MILESTONE</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {progress.next} Tier
                {progress.next !== 'Maximum' && (
                  <span className="text-gray-600 font-normal"> — {progress.total - progress.current} more points needed</span>
                )}
              </p>
            </div>
          )}

          {/* Benefits Hint */}
          {currentScore < 100 && (
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium">HOW TO IMPROVE</p>
              <ul className="text-xs text-gray-700 mt-2 space-y-1">
                <li>• Post more RFQs to increase engagement</li>
                <li>• Close your RFQs promptly to boost response rate</li>
                <li>• Select vendors consistently to improve acceptance rate</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tier Features Comparison */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Tier</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Benefits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tierData.map((tier) => (
              <tr
                key={tier.name}
                className={currentScore >= tier.min && currentScore <= tier.max ? 'bg-blue-50' : 'bg-white'}
              >
                <td className="px-4 py-3 font-semibold text-gray-900">
                  <span className="mr-2">{tier.emoji}</span>
                  {tier.name}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {tier.name === 'Bronze' && 'Starting point, building reputation'}
                  {tier.name === 'Silver' && 'Better vendor visibility, trusted by vendors'}
                  {tier.name === 'Gold' && 'Premium placement, faster responses'}
                  {tier.name === 'Platinum' && 'VIP status, exclusive vendor access'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
