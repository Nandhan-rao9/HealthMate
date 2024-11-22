export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  gender: 'male' | 'female';
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins: {
    a: number;
    c: number;
    d: number;
    e: number;
  };
  minerals: {
    iron: number;
    calcium: number;
    potassium: number;
  };
}

export interface FoodItem {
  name: string;
  nutrition: NutritionalInfo;
  confidence: number;
}