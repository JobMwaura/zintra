'use client';

/**
 * RFQTabs Component
 * 
 * Tab navigation for RFQ dashboard
 * Shows active tab highlight and badge indicators
 * 
 * @usage
 * <RFQTabs activeTab={activeTab} onTabChange={setActiveTab} stats={stats} />
 */

import { BarChart3, Zap, History, MessageSquare, Star } from 'lucide-react';

export default function RFQTabs({ activeTab, onTabChange, stats }) {
  const tabs = [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Zap className="w-4 h-4" />,
      count: stats?.pending || 0,
      description: 'Waiting for quotes'
    },
    {
      id: 'active',
      label: 'Active',
      icon: <BarChart3 className="w-4 h-4" />,
      count: stats?.active || 0,
      description: 'With quotes'
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="w-4 h-4" />,
      count: stats?.completed || 0,
      description: 'Completed'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="w-4 h-4" />,
      count: 0,
      description: 'From vendors'
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Star className="w-4 h-4" />,
      count: 0,
      description: 'Bookmarked'
    }
  ];

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-max px-6 py-4 font-semibold text-sm transition-all
                border-b-2 flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              
              {/* Badge with count */}
              {tab.count > 0 && (
                <span className={`
                  ml-auto px-2 py-0.5 rounded-full text-xs font-bold
                  ${
                    activeTab === tab.id
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-200 text-slate-700'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
