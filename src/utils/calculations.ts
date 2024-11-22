import { UserProfile } from '../types';

export const calculateBMR = (profile: UserProfile): number => {
  const { weight, height, age, gender } = profile;
  
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  }
  return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
};

export const calculateDailyNeeds = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9
  };
  
  return bmr * activityMultipliers[profile.activityLevel];
};

export const calculateMacroTargets = (dailyCalories: number) => {
  return {
    protein: (dailyCalories * 0.3) / 4, // 30% of calories from protein
    carbs: (dailyCalories * 0.45) / 4,  // 45% of calories from carbs
    fat: (dailyCalories * 0.25) / 9     // 25% of calories from fat
  };
};