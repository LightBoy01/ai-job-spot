import React from 'react';
import Icon from './Icon';

interface SalaryStats {
  min: number;
  max: number;
  avg: number;
  count: number;
  currency: string;
}

interface SalaryInsightsProps {
  insight: SalaryStats | null;
  currentJobSalary?: number | null;
}

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SalaryInsights: React.FC<SalaryInsightsProps> = ({ insight, currentJobSalary }) => {
  if (!insight || insight.count === 0) {
    return null;
  }

  // Calculate percentages for the bar chart
  const range = insight.max - insight.min;
  const avgPosition = range === 0 ? 50 : ((insight.avg - insight.min) / range) * 100;
  
  let currentPosition = null;
  if (currentJobSalary) {
    // Clamp between 0 and 100
    const rawPos = ((currentJobSalary - insight.min) / range) * 100;
    currentPosition = Math.max(0, Math.min(100, rawPos));
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm my-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
      
      <div className="flex items-center mb-6">
        <div className="bg-secondary/10 p-2 rounded-lg mr-4">
          <Icon name="chart" className="h-6 w-6 text-secondary-dark" />
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold text-primary-dark">Market Salary Analysis</h3>
          <p className="text-sm text-neutral-500">
            Based on {insight.count} similar job postings
          </p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="relative h-12 mb-8 mt-4 mx-2">
        {/* Background Track */}
        <div className="absolute top-1/2 left-0 w-full h-3 bg-neutral-100 rounded-full -translate-y-1/2"></div>
        
        {/* Active Range (Min to Max) - In this context, the whole track is the range, 
            but we can style the 'middle' 50% to look like the 'common' range if we had std dev.
            For now, simpler is better. */}
        
        {/* Average Marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-neutral-400 z-10"
          style={{ left: `${avgPosition}%` }}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-neutral-500 bg-white px-1 whitespace-nowrap">
            Avg: {formatCurrency(insight.avg, insight.currency)}
          </div>
        </div>

        {/* Current Job Marker */}
        {currentPosition !== null && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-500 ease-out"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-secondary-dark bg-secondary/10 px-2 py-0.5 rounded-full whitespace-nowrap border border-secondary/20">
              This Job
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center divide-x divide-neutral-100">
        <div className="px-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Low</p>
          <p className="text-lg font-bold text-neutral-700">{formatCurrency(insight.min, insight.currency)}</p>
        </div>
        <div className="px-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Average</p>
          <p className="text-lg font-bold text-primary-dark">{formatCurrency(insight.avg, insight.currency)}</p>
        </div>
        <div className="px-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">High</p>
          <p className="text-lg font-bold text-neutral-700">{formatCurrency(insight.max, insight.currency)}</p>
        </div>
      </div>
    </div>
  );
};

export default SalaryInsights;
