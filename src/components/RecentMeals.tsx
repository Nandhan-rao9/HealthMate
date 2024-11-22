import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  image: string;
}

interface RecentMealsProps {
  meals: Meal[];
}

export const RecentMeals = ({ meals }: RecentMealsProps) => {
  if (meals.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No meals recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meals.map((meal, index) => (
        <motion.div
          key={`${meal.name}-${meal.time}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
        >
          <div className="flex items-center gap-4">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={meal.image}
              alt={meal.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-200 capitalize">{meal.name.toLowerCase()}</h3>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {meal.time}
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-200">{Math.round(meal.calories)} kcal</p>
              <p className="text-sm text-gray-400">{Math.round(meal.protein)}g protein</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};