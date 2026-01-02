'use client';

/**
 * RFQCard Component
 * 
 * Display a single RFQ in card format
 * Shows title, quotes, deadline, status, and quick actions
 */

import { MessageSquare, Eye, ArrowRight, Star, MoreVertical, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function RFQCard({ 
  rfq, 
  onViewQuotes, 
  onViewDetails,
  onMessage,
  onFavorite,
  formatDate,
  getDaysUntilDeadline,
  getStatusStyles,
  getPriceStats
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const statusStyles = getStatusStyles(rfq);
  const priceStats = getPriceStats(rfq);
  const daysLeft = getDaysUntilDeadline(rfq.expires_at);

  const isClosingSoon = daysLeft >= 0 && daysLeft <= 3;
  const isOverdue = daysLeft < 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-slate-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
              {rfq.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {rfq.category} • {rfq.location}
            </p>
          </div>

          {/* Menu button */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    onViewDetails?.(rfq.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    onFavorite?.(rfq.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                >
                  {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-t"
                >
                  Send Reminder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status and Quote Count */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`${statusStyles.bg} ${statusStyles.text} px-3 py-1 rounded-full text-xs font-semibold`}>
            {statusStyles.label}
          </span>

          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
            {rfq.rfq_responses.length} Quote{rfq.rfq_responses.length !== 1 ? 's' : ''}
          </span>

          {isClosingSoon && daysLeft >= 0 && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Closing Soon
            </span>
          )}

          {isOverdue && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              ⚠️ Overdue
            </span>
          )}
        </div>

        {/* Price Statistics (if quotes exist) */}
        {rfq.rfq_responses.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-600 font-medium">Lowest</p>
              <p className="text-sm font-semibold text-slate-900">
                KSh {priceStats.min?.toLocaleString() || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Average</p>
              <p className="text-sm font-semibold text-slate-900">
                KSh {Math.round(priceStats.avg)?.toLocaleString() || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Highest</p>
              <p className="text-sm font-semibold text-slate-900">
                KSh {priceStats.max?.toLocaleString() || '-'}
              </p>
            </div>
          </div>
        )}

        {/* Deadline */}
        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-600 font-medium">Deadline</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatDate(rfq.expires_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600 font-medium">
              {daysLeft >= 0 ? 'Days Left' : 'Overdue by'}
            </p>
            <p className={`text-lg font-bold ${
              isOverdue ? 'text-red-600' :
              isClosingSoon ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Description */}
        {rfq.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {rfq.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          {rfq.rfq_responses.length > 0 && (
            <button
              onClick={() => onViewQuotes?.(rfq.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <DollarSign className="w-4 h-4" />
              Compare Quotes
            </button>
          )}

          <button
            onClick={() => onViewDetails?.(rfq.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              rfq.rfq_responses.length > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            View
          </button>

          <button
            onClick={() => onMessage?.(rfq.id)}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition"
            title="Message vendors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsFavorite(!isFavorite);
              onFavorite?.(rfq.id);
            }}
            className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition ${
              isFavorite
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-slate-100 text-slate-400 hover:text-yellow-600'
            }`}
            title="Add to favorites"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
