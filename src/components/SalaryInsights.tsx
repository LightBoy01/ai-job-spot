
import { SalaryInsight } from '@/lib/seoUtils';
import React from 'react';

interface SalaryInsightsProps {
  insight: SalaryInsight | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SalaryInsights: React.FC<SalaryInsightsProps> = ({ insight }) => {
  if (!insight || insight.count === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-50/70 p-6 rounded-lg shadow-inner border border-neutral-200/80 my-8">
      <h3 className="text-xl font-bold text-neutral-800 mb-4 font-serif">Salary Insights</h3>
      <p className="text-sm text-neutral-600 mb-6">
        Based on {insight.count} job posting(s) in this category.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Minimum</p>
          <p className="text-2xl font-bold text-primary-dark">{formatCurrency(insight.min)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Average</p>
          <p className="text-2xl font-bold text-primary-dark">{formatCurrency(insight.average)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Maximum</p>
          <p className="text-2xl font-bold text-primary-dark">{formatCurrency(insight.max)}</p>
        </div>
      </div>
    </div>
  );
};

export default SalaryInsights;
