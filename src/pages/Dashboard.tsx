import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { BarChart2, Utensils, Activity, Target } from "lucide-react";
import axios from "axios";
import { NutrientSphere } from "../components/NutrientSphere";
import { AnimatedProgressRing } from "../components/AnimatedProgressRing";

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  image: string;
}

export const Dashboard = () => {
  const [currentNutrition, setCurrentNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);

  const nutritionTarget = {
    calories: 2346,
    protein: 134,
    carbs: 197,
    fat: 64,
  };

  useEffect(() => {
    const fetchNutritionData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/getnutrition");
        const nutritionData = response.data;

        setCurrentNutrition({
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
        });

        const newMeal = {
          name: nutritionData.name,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          image: `https://source.unsplash.com/featured/?${encodeURIComponent(
            nutritionData.name
          )},food`,
        };

        setRecentMeals((prevMeals) => [newMeal, ...prevMeals].slice(0, 5));
      } catch (error) {
        console.error("Error fetching nutrition data:", error);
      }
    };

    fetchNutritionData();
    const interval = setInterval(fetchNutritionData, 5000); // Refresh data every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: "Daily Calories",
      value: currentNutrition.calories,
      target: nutritionTarget.calories,
      icon: Activity,
      color: "#60A5FA",
    },
    {
      label: "Protein",
      value: currentNutrition.protein,
      target: nutritionTarget.protein,
      unit: "g",
      icon: Target,
      color: "#34D399",
    },
    {
      label: "Carbs",
      value: currentNutrition.carbs,
      target: nutritionTarget.carbs,
      unit: "g",
      icon: BarChart2,
      color: "#F472B6",
    },
    {
      label: "Fat",
      value: currentNutrition.fat,
      target: nutritionTarget.fat,
      unit: "g",
      icon: Utensils,
      color: "#FBBF24",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold"
      >
        Nutrition Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(
          ({ label, value, target, unit = "", icon: Icon, color }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-300">{label}</h3>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <div className="flex items-center justify-center">
                <AnimatedProgressRing
                  progress={(value / target) * 100}
                  color={color}
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold">
                  {value}
                  {unit}
                  <span className="text-sm text-gray-400 ml-2">
                    / {target}
                    {unit}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        )}
      </div>
    </motion.div>
  );
};
