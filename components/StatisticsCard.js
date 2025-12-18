'use client';

/**
 * StatisticsCard Component
 * 
 * Display key performance indicators for RFQ dashboard
 * Shows metrics like total RFQs, pending, active, etc.
 */

import { TrendingUp, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

export default function StatisticsCard({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total RFQs',
      value: stats?.total || 0,
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Pending',
      value: stats?.pending || 0,
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      trend: 'needs attention'
    },
    {
      label: 'Active',
      value: stats?.active || 0,
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'New This Week',
      value: stats?.newQuotesThisWeek || 0,
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'On-Time Rate',
      value: `${stats?.onTimeClosureRate || 0}%`,
      icon: <CheckCircle className="w-5 h-5 text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className={`${metric.bgColor} ${metric.borderColor} border rounded-lg shadow-sm p-4 transition-transform hover:shadow-md hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              {metric.label}
            </span>
            {metric.icon}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {metric.value}
          </p>
          {metric.trend && (
            <p className="text-xs text-yellow-700 mt-1">{metric.trend}</p>
          )}
        </div>
      ))}
    </div>
  );
}
