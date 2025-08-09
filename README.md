
# HealthMate  

## Overview  
[HealthMate](https://github.com/Nandhan-rao9/HealthMate) is an AI-powered nutrition tracking, meal analysis, and recommendation platform.  
It allows users to easily log meals through image uploads or text input, receive detailed nutritional breakdowns, visualize dietary progress, and obtain personalized food recommendations based on deficiencies.  
With weekly and daily tracking capabilities, HealthMate helps users maintain a balanced diet while leveraging modern machine learning for food recognition.  

## Features  
- **Image-Based Meal Recognition:** Upload an image of your meal and let the system identify the food items using machine learning models.  
- **Text-Based Entry:** Type the name of the food and get instant nutritional data.  
- **API Integrations:**  
  - USDA API for comprehensive nutrition databases.  
  - Edamam & Nutritionix API for fast and flexible food searches.  
  - OpenAI API for intelligent chatbot-based recommendations.  
- **Database Management:** Store meal history in a SQLite database with SQLAlchemy ORM.  
- **Nutrition Visualizations:**  
  - Bar charts showing daily nutritional targets vs. actual intake.  
  - Pie charts illustrating each meal’s contribution to daily goals.  
- **Date-Wise Retrieval:** Select any date to review that day's meals and nutrition data.  
- **Weekly Overview:** Track your meals and nutrients over a 7-day period.  
- **ML-Powered Recommendations:** Suggests nutrient-rich foods to fill any dietary gaps detected from your history.  
- **Responsive UI:** User-friendly interface for both desktop and mobile.  

## Machine Learning Usage  
- **Food Image Classification:** Pre-trained deep learning models process uploaded meal images to identify food items.  
- **Nutrient Deficiency Detection:** Analyzes logged meals to find gaps in essential nutrients.  
- **Recommendation Engine:** Uses AI to suggest alternative or additional foods to balance nutrition.  
- **Data Visualization:** Generates real-time visual feedback using matplotlib.  

## Tech Stack  
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Flask (Python)  
- **Database:** SQLite with SQLAlchemy  
- **APIs:** USDA, Edamam, Nutritionix, OpenAI API  
- **Machine Learning:** TensorFlow / PyTorch for image classification  
- **Visualization:** Matplotlib  
- **Deployment:** Local/Cloud  

## Installation  
1. Clone the repository:  
```bash
git clone https://github.com/Nandhan-rao9/HealthMate.git
cd HealthMate
````

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the application:

```bash
python app.py
```

5. Open your browser and go to:

```
http://127.0.0.1:5000
```

## Usage

* **Add a Meal:** Upload an image or type the food name.
* **View History:** Retrieve meals for a specific date.
* **Visualize Nutrition:** Access bar and pie charts for diet analysis.
* **Get Recommendations:** Ask the AI chatbot for food suggestions to balance your diet.

## Database Structure

* **meals** table:

  * id (int)
  * date (text)
  * meal\_name (text)
  * nutrition\_data (json)


