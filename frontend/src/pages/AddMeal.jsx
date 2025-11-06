import React, { useState } from 'react';

function calculateMealTotal(mealItems) {
  const total = {
    calories: 0, protein: 0, fat: 0, carbohydrates: 0,
    calcium: 0, iron: 0, magnesium: 0, zinc: 0,
    vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0,
  };

  for (const item of mealItems) {
    if (item.nutritionData && item.nutritionData.nutrients) {
      const nutrients = item.nutritionData.nutrients;
      
      for (const key of Object.keys(total)) {
        if (nutrients[key]) {
          total[key] += nutrients[key].amount;
        }
      }
    }
  }

  for (const key of Object.keys(total)) {
    total[key] = Math.round(total[key] * 100) / 100;
  }

  return total;
}

function AddMeal() {
  const [files, setFiles] = useState([]); // To hold uploaded image files
  const [mealItems, setMealItems] = useState([]); // The list of foods in this meal
  
  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState(100);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");


  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files)); // Store all selected files
  };

  const handleImageAnalyze = async () => {
    if (files.length === 0) {
      setMessage("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setMessage("Analyzing images...");
    setMealItems([]); // Clear previous items

    const formData = new FormData();
    formData.append('file', files[0]); 
    
    try {
      const response = await fetch('http://localhost:5000/identify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Analysis complete! Add quantities and get nutrition.");
        const newItems = data.detected_dishes.map(dishName => ({
          id: `${dishName}-${Date.now()}`, // Unique ID
          name: dishName,
          quantity_g: 100, // Default to 100g
          nutritionData: null, // No nutrition data yet
          status: 'pending' // 'pending', 'loading', 'success', 'error'
        }));
        setMealItems(newItems);
      } else {
        throw new Error(data.error || "Failed to analyze image.");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleManualAdd = () => {
    if (!manualName || !manualQuantity) {
      setMessage("Please enter a food name and quantity.");
      return;
    }
    
    const newItem = {
      id: `${manualName}-${Date.now()}`,
      name: manualName,
      quantity_g: Number(manualQuantity),
      nutritionData: null,
      status: 'pending'
    };

    setMealItems(prevItems => [...prevItems, newItem]);

    setManualName("");
    setManualQuantity(100);
  };

  
  const handleQuantityChange = (id, newQuantity) => {
    setMealItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity_g: Number(newQuantity), status: 'pending', nutritionData: null } : item
      )
    );
  };


  const handleFetchNutrition = async (id) => {
    const item = mealItems.find(i => i.id === id);
    if (!item) return;

    setMealItems(prevItems =>
      prevItems.map(i => (i.id === id ? { ...i, status: 'loading' } : i))
    );

    try {
      const response = await fetch('http://localhost:5000/get_nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: item.name,
          quantity_g: item.quantity_g
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update this item with the new data and 'success' status
        setMealItems(prevItems =>
          prevItems.map(i => (i.id === id ? { ...i, nutritionData: data, status: 'success' } : i))
        );
      } else {
        throw new Error(data.error || "Nutrition data not found.");
      }
    } catch (error) {
      setMealItems(prevItems =>
        prevItems.map(i => (i.id === id ? { ...i, status: 'error', message: error.message } : i))
      );
    }
  };

  const handleCommitMeal = () => {
    const pendingItems = mealItems.filter(item => item.status !== 'success');
    if (pendingItems.length > 0) {
      setMessage("Please fetch nutrition data for all items before committing.");
      return;
    }

    const finalMealData = {
      items: mealItems,
      total: calculateMealTotal(mealItems),
      date: new Date().toISOString()
    };
    
    console.log("COMMITTING MEAL:", finalMealData);
    setMessage("Meal committed successfully! (Check console)");

    setMealItems([]);
    setFiles([]);
  };

  const mealTotal = calculateMealTotal(mealItems);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
      <h1>Add a New Meal</h1>

      {/* --- Section 1: Image Upload --- */}
      <div className="add-meal-section">
        <h2>1. Analyze from Image</h2>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleImageAnalyze} disabled={isLoading} className="auth-form button">
          {isLoading ? "Analyzing..." : "Analyze Images"}
        </button>
      </div>

      {/* --- Section 2: Manual Entry --- */}
      <div className="add-meal-section">
        <h2>2. Add Manually</h2>
        <div className="manual-add-form">
          <input
            type="text"
            placeholder="Food Name (e.g., Apple)"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity (g)"
            value={manualQuantity}
            onChange={e => setManualQuantity(e.target.value)}
          />
          <button onClick={handleManualAdd}>Add Food</button>
        </div>
      </div>

      {/* --- Section 3: Meal Item List --- */}
      <div className="add-meal-section">
        <h2>3. Review Your Meal</h2>
        {message && <p>{message}</p>}
        
        <div className="meal-items-list">
          {mealItems.length === 0 && <p>Add items from an image or manually.</p>}
          
          {mealItems.map(item => (
            <div key={item.id} className="meal-item-card">
              <h3>{item.name}</h3>
              <div className="item-controls">
                <label>Quantity (g):</label>
                <input
                  type="number"
                  value={item.quantity_g}
                  onChange={e => handleQuantityChange(item.id, e.target.value)}
                />
                <button onClick={() => handleFetchNutrition(item.id)} disabled={item.status === 'loading'}>
                  {item.status === 'loading' ? '...' : 'Get Nutrition'}
                </button>
              </div>
              
              {/* --- Nutrition Display --- */}
              {item.status === 'success' && item.nutritionData && (
                <div className="nutrition-details">
                  <p><strong>Calories:</strong> {item.nutritionData.nutrients.calories?.amount || 0} kcal</p>
                  <p><strong>Protein:</strong> {item.nutritionData.nutrients.protein?.amount || 0} g</p>
                  <p><strong>Fat:</strong> {item.nutritionData.nutrients.fat?.amount || 0} g</p>
                  <p><strong>Carbs:</strong> {item.nutritionData.nutrients.carbohydrates?.amount || 0} g</p>
                  {/* You can add all the other micros here */}
                </div>
              )}
              {item.status === 'error' && <p style={{color: 'red'}}>{item.message}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* --- Section 4: Meal Total --- */}
      {mealItems.length > 0 && (
        <div className="add-meal-section meal-total-card">
          <h2>Meal Total</h2>
          <div className="nutrition-grid">
            <p><strong>Calories:</strong> {mealTotal.calories} kcal</p>
            <p><strong>Protein:</strong> {mealTotal.protein} g</p>
            <p><strong>Fat:</strong> {mealTotal.fat} g</p>
            <p><strong>Carbs:</strong> {mealTotal.carbohydrates} g</p>
            {/* Add micros if you want */}
          </div>
          <button onClick={handleCommitMeal} className="auth-form button" style={{width: '100%', background: '#007bff'}}>
            Commit Meal
          </button>
        </div>
      )}
    </div>
  );
}

export default AddMeal;
