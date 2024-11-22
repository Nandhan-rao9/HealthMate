import React, { createContext, useContext, useState } from 'react';

interface NutritionData {
  name: string;
  confidence: number;
  nutrition: {
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
      e: number;
    };
  };
}

interface Profile {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityLevel: string;
  goal: string;
}

interface NutritionContextType {
  currentFood: NutritionData[];
  profile: Profile | null;
  currentNutrition: any;
  nutritionTarget: any;
  handleImageAnalysis: (file: File) => Promise<void>;
  updateProfile: (profile: Profile) => void;
  setCurrentFood: any
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentFood, setCurrentFood] = useState<NutritionData[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const handleImageAnalysis = async (file: File) => {
    // Implement your image analysis logic here
    // For now, we'll use mock data
    const mockData: NutritionData = {
      name: 'Sample Food',
      confidence: 0.95,
      nutrition: {
        calories: 250,
        protein: 15,
        carbs: 30,
        fat: 8,
        minerals: {
          calcium: 100,
          iron: 2,
          potassium: 300,
        },
        vitamins: {
          a: 800,
          c: 60,
          d: 10,
          e: 15,
        },
      },
    };
    setCurrentFood([mockData]);
  };

  const updateProfile = (newProfile: Profile) => {
    setProfile(newProfile);
  };

  const currentNutrition = {
    calories: 985,
    protein: 75,
    carbs: 180,
    fat: 50,
  };

  const nutritionTarget = {
    calories: 2354,
    protein: 150,
    carbs: 250,
    fat: 70,
  };

  return (
    <NutritionContext.Provider
      value={{
        currentFood,
        profile,
        currentNutrition,
        nutritionTarget,
        handleImageAnalysis,
        updateProfile,
        setCurrentFood
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};