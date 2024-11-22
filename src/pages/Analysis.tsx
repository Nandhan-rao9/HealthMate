import React, { useState } from "react";
import { Camera, AlertCircle, Loader2, Check } from "lucide-react";
import { useNutrition } from "../context/NutritionContext";
import axios from "axios";

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals: {
    calcium: number;
    iron: number;
    potassium: number;
  };
  vitamins: {
    a: number;
    c: number;
    d: number;
  };
}

interface FoodItem {
  name: string;
  confidence: number;
  nutrition: NutritionData;
}

export const Analysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [isCommitting, setIsCommitting] = useState(false);

  const { currentFood, setCurrentFood } = useNutrition();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "http://127.0.0.1:8000/analyze-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const initialQuantities = response.data.reduce(
        (acc: any, _: any, index: number) => {
          acc[index] = 100;
          return acc;
        },
        {}
      );

      setQuantities(initialQuantities);
      setCurrentFood(response.data);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setErrorMessage("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: Math.max(0, Math.min(500, newQuantity)),
    }));
  };

  const calculateAdjustedNutrients = (
    nutrition: NutritionData,
    quantity: number
  ) => {
    const ratio = quantity / 100;
    return {
      calories: Math.round(nutrition.calories * ratio),
      protein: Math.round(nutrition.protein * ratio),
      carbs: Math.round(nutrition.carbs * ratio),
      fat: Math.round(nutrition.fat * ratio),
      minerals: {
        calcium: Math.round(nutrition.minerals.calcium * ratio),
        iron: Math.round(nutrition.minerals.iron * ratio),
        potassium: Math.round(nutrition.minerals.potassium * ratio),
      },
      vitamins: {
        a: Math.round(nutrition.vitamins.a * ratio),
        c: Math.round(nutrition.vitamins.c * ratio),
        d: Math.round(nutrition.vitamins.d * ratio),
      },
    };
  };

  const handleCommit = async () => {
    if (!currentFood.length) return;

    setIsCommitting(true);
    try {
      // Calculate total nutrients from all foods
      const totalNutrients = currentFood.reduce(
        (total, food: FoodItem, index) => {
          const adjustedNutrition = calculateAdjustedNutrients(
            food.nutrition,
            quantities[index]
          );
          return {
            calories: total.calories + adjustedNutrition.calories,
            protein: total.protein + adjustedNutrition.protein,
            carbs: total.carbs + adjustedNutrition.carbs,
            fat: total.fat + adjustedNutrition.fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Prepare the data to send to the backend
      const foodData = currentFood.map((food: FoodItem, index: number) => ({
        name: food.name,
        quantity: quantities[index],
        nutrition: calculateAdjustedNutrients(
          food.nutrition,
          quantities[index]
        ),
      }));

      // Send the data to the backend
      const response = await axios.post("http://127.0.0.1:8000/commit", {
        foodData,
        totalNutrients,
      });

      if (response.status === 200) {
        // If commit is successful, reset everything
        setCurrentFood([]);
        setQuantities({});
        setErrorMessage(null);
        alert("Nutrition data successfully committed!");
      } else {
        throw new Error("Failed to commit data");
      }
    } catch (error) {
      console.error("Error committing nutrition data:", error);
      setErrorMessage("Failed to commit nutrition data. Please try again.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Food Analysis</h1>

      {errorMessage && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Camera className="h-6 w-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold">Upload Food Image</h2>
          </div>

          <label className="block w-full cursor-pointer">
            <div
              className={`border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors ${
                isAnalyzing ? "opacity-50" : "hover:border-blue-400"
              }`}
            >
              {isAnalyzing ? (
                <Loader2 className="h-12 w-12 mx-auto text-blue-400 mb-4 animate-spin" />
              ) : (
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              )}
              <p className="text-gray-300">
                {isAnalyzing
                  ? "Analyzing..."
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isAnalyzing}
            />
          </label>
        </div>

        {currentFood.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              <button
                onClick={handleCommit}
                disabled={isCommitting}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isCommitting
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isCommitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                <span>{isCommitting ? "Committing..." : "Commit Changes"}</span>
              </button>
            </div>

            <div className="space-y-6">
              {currentFood.map((food: FoodItem, index) => {
                const adjustedNutrition = calculateAdjustedNutrients(
                  food.nutrition,
                  quantities[index]
                );
                return (
                  <div
                    key={index}
                    className="border-b border-gray-700 last:border-0 py-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-blue-400">
                        {food.name}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {Math.round(food.confidence * 100)}% confidence
                      </span>
                    </div>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                          onClick={() =>
                            updateQuantity(index, quantities[index] - 10)
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantities[index]}
                          onChange={(e) =>
                            updateQuantity(index, Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded text-center"
                          min="0"
                          max="500"
                          step="10"
                        />
                        <button
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                          onClick={() =>
                            updateQuantity(index, quantities[index] + 10)
                          }
                        >
                          +
                        </button>
                        <span className="text-gray-400">grams</span>
                      </div>
                      <input
                        type="range"
                        value={quantities[index]}
                        onChange={(e) =>
                          updateQuantity(index, Number(e.target.value))
                        }
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        min="0"
                        max="500"
                        step="10"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
                      <div>Calories: {adjustedNutrition.calories}kcal</div>
                      <div>Protein: {adjustedNutrition.protein}g</div>
                      <div>Carbs: {adjustedNutrition.carbs}g</div>
                      <div>Fat: {adjustedNutrition.fat}g</div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>Calcium: {adjustedNutrition.minerals.calcium}mg</div>
                      <div>Iron: {adjustedNutrition.minerals.iron}mg</div>
                      <div>
                        Potassium: {adjustedNutrition.minerals.potassium}mg
                      </div>
                      <div>Vitamin A: {adjustedNutrition.vitamins.a}IU</div>
                      <div>Vitamin C: {adjustedNutrition.vitamins.c}mg</div>
                      <div>Vitamin D: {adjustedNutrition.vitamins.d}IU</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
