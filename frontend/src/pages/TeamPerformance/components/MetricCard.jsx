import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'bg-blue-500/10 text-blue-400',
      text: 'text-blue-500 dark:text-blue-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-emerald-500/10 text-emerald-400',
      text: 'text-emerald-500 dark:text-emerald-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'bg-purple-500/10 text-purple-400',
      text: 'text-purple-500 dark:text-purple-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'bg-amber-500/10 text-amber-400',
      text: 'text-amber-500 dark:text-amber-400',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${style.border} bg-white/70 dark:bg-[#131b2e]/80 backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {value}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${style.bg}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
