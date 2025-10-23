function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const factor = activityFactors[activityLevel] || 1.2;
  return bmr * factor;
}

function calculateCalorieGoal(tdee, goal) {
  switch (goal) {
    case 'lose_weight':
      return tdee - 500;
    case 'gain_weight':
      return tdee + 500;
    case 'recomp':
      return tdee;
    case 'maintain':
    default:
      return tdee;
  }
}

export function calculateUserProfile(userData) {
  const { weight, height, age, gender, activityLevel, goal } = userData;
  if (!weight || !height || !age || !gender || !activityLevel || !goal) {
    return { error: "All fields are required." };
  }
  const bmr = calculateBMR(Number(weight), Number(height), Number(age), gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const calorieGoal = calculateCalorieGoal(tdee, goal);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(calorieGoal),
  };
}
