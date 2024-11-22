// Deficiencies.tsx
import { Info } from 'lucide-react';
import React from 'react';

interface DeficiencyProps {
  comparisonData: {
    nutrient: string;
    Target: number;
    Actual: number;
    percentage: number;
  }[];
}

const Deficiencies: React.FC<DeficiencyProps> = ({ comparisonData }) => {
  const deficiencies = comparisonData.filter(item => item.Actual < item.Target);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Info className="h-6 w-6 text-blue-400 mr-2" />
        <h2 className="text-xl font-semibold">Nutrient Deficiencies</h2>
      </div>
      <div className="space-y-4">
        {deficiencies.length > 0 ? (
          deficiencies.map((deficiency) => (
            <div key={deficiency.nutrient} className="text-sm text-gray-300">
              <strong>{deficiency.nutrient}</strong> is deficient. (Target: {deficiency.Target} | Actual: {deficiency.Actual})
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-300">
            No nutrient deficiencies detected. Your intake is on target.
          </div>
        )}
      </div>
    </div>
  );
};

export default Deficiencies;
