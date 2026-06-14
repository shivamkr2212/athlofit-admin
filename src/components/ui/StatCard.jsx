import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, to }) {
  const navigate = useNavigate();
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
  };
  const c = colors[color] || colors.blue;

  const clickable = !!to;

  return (
    <div
      onClick={clickable ? () => navigate(to) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(to); } } : undefined}
      className={`card p-5 border ${c.border} ${
        clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
            {title}
            {clickable && <ArrowUpRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span>{trend > 0 ? '+' : ''}{trend}% vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.bg}`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
