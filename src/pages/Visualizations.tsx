import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, TrendingUp, PieChart as PieChartIcon, BarChart2, Info } from 'lucide-react';

const timeRanges = ['Daily', 'Weekly', 'Monthly'] as const;
type TimeRange = typeof timeRanges[number];

type NutritionData = {
  daily: {
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: number;
    minerals: number;
  }[];
  weekly: {
    day: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: number;
    minerals: number;
  }[];
  monthly: {
    date: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: number;
    minerals: number;
  }[];
};

export const Visualizations = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('Daily');
  const [activeNutrient, setActiveNutrient] = useState('calories');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');

  // Enhanced mock data with targets and actual values
  const nutritionData: NutritionData = {
    daily: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      calories: Math.random() * 300 + 100,
      protein: Math.random() * 20 + 5,
      carbs: Math.random() * 30 + 10,
      fat: Math.random() * 15 + 5,
      fiber: Math.random() * 10 + 2,
      vitamins: Math.random() * 100,
      minerals: Math.random() * 100,
    })),
    weekly: Array.from({ length: 7 }, (_, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      calories: Math.random() * 2000 + 1500,
      protein: Math.random() * 150 + 50,
      carbs: Math.random() * 250 + 100,
      fat: Math.random() * 80 + 30,
      fiber: Math.random() * 35 + 15,
      vitamins: Math.random() * 100,
      minerals: Math.random() * 100,
    })),
    monthly: Array.from({ length: 30 }, (_, i) => ({
      date: i + 1,
      calories: Math.random() * 2000 + 1500,
      protein: Math.random() * 150 + 50,
      carbs: Math.random() * 250 + 100,
      fat: Math.random() * 80 + 30,
      fiber: Math.random() * 35 + 15,
      vitamins: Math.random() * 100,
      minerals: Math.random() * 100,
    })),
  };

  // Nutrition targets
  const nutritionTargets = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
    fiber: 30,
    vitamins: 100,
    minerals: 100,
  };

  // Compare actual vs target data
  const comparisonData = Object.entries(nutritionTargets).map(([nutrient, target]) => {
    const actual = nutritionData[selectedRange.toLowerCase() as keyof NutritionData].reduce(
      (acc, curr) => acc + curr[nutrient as keyof typeof curr],
      0
    ) / nutritionData[selectedRange.toLowerCase() as keyof NutritionData].length;

    return {
      nutrient: nutrient.charAt(0).toUpperCase() + nutrient.slice(1),
      Target: target,
      Actual: Math.round(actual),
      percentage: Math.round((actual / target) * 100),
    };
  });

  const nutrientInfo = {
    calories: 'Daily energy intake measured in kcal',
    protein: 'Essential for muscle building and repair',
    carbs: 'Primary energy source for the body',
    fat: 'Important for hormone production and nutrient absorption',
    fiber: 'Aids digestion and promotes gut health',
    vitamins: 'Essential micronutrients for various body functions',
    minerals: 'Required for bone health and cellular processes',
  };

  const currentData = nutritionData[selectedRange.toLowerCase() as keyof NutritionData];

  const handleNutrientHover = (nutrient: string) => {
    setTooltipContent(nutrientInfo[nutrient as keyof typeof nutrientInfo]);
    setShowTooltip(true);
  };

  const colors = {
    calories: '#60A5FA',
    protein: '#34D399',
    carbs: '#F472B6',
    fat: '#FBBF24',
    fiber: '#A78BFA',
    vitamins: '#F87171',
    minerals: '#38BDF8',
  };

  // Function to detect deficiencies
  const deficiencies = comparisonData.filter(item => item.percentage < 80);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Nutrition Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((range) => (
            <motion.button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {range}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target vs Actual Comparison */}
        <motion.div
          className="bg-gray-800 rounded-lg p-6 shadow-lg lg:col-span-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BarChart2 className="h-6 w-6 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold">Target vs Actual Nutrition</h2>
            </div>
            {showTooltip && (
              <div className="bg-gray-700 p-2 rounded-lg text-sm max-w-xs">
                {tooltipContent}
              </div>
            )}
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="nutrient" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar dataKey="Target" fill="#60A5FA" opacity={0.7} />
                <Bar dataKey="Actual" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          className="bg-gray-800 rounded-lg p-6 shadow-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold">Nutrition Trends</h2>
          </div>
          <div className="space-x-2 mb-4">
            {Object.keys(colors).map((nutrient) => (
              <button
                key={nutrient}
                onClick={() => setActiveNutrient(nutrient)}
                onMouseEnter={() => handleNutrientHover(nutrient)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeNutrient === nutrient
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={activeNutrient}
                  stroke={colors[activeNutrient as keyof typeof colors]}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Deficiencies */}
        <motion.div
          className="bg-gray-800 rounded-lg p-6 shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 text-red-400 mr-2" />
            <h2 className="text-xl font-semibold">Deficiencies</h2>
          </div>
          {deficiencies.length > 0 ? (
            <ul>
              {deficiencies.map((deficiency) => (
                <li
                  key={deficiency.nutrient}
                  className="flex items-center justify-between py-2 border-b border-gray-700"
                >
                  <span className="text-sm text-red-500">{deficiency.nutrient}</span>
                  <span className="text-sm text-gray-300">
                    {deficiency.percentage}% of target
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-500">No deficiencies detected</p>
          )}
          <h2 className="text-xl font-semibold mt-2">Potential Diseases</h2>
          <h3><span className="text-lg text-red-500 mt-2">No Heart Risks</span></h3>
        </motion.div>
        
      </div>
    </motion.div>
  );
};
