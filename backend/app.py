from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import base64
from pymongo import MongoClient
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# USDA API configuration
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

# MongoDB connection
client = MongoClient(os.getenv('MONGO_URI'))
db = client['nutrition_db']
food_collection = db['food_data']
total_nutrients_collection = db['total_nutrients']

# User data structure for nutritional information
user_nutritional_data = {'food_items': []}

class ImageAnalyzer:
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)

    def encode_image(self, image_file):
        """Encode image from file upload to base64 string."""
        image_data = image_file.read()
        return base64.b64encode(image_data).decode('utf-8')

    def analyze_image_ML(self, image_file, prompt="What food items are in this image? Please list them separately, just identify the eatables and if the food has any harmful products give a warning message"):
        """Analyze an image using OpenAI's Vision API."""
        try:
            base64_image = self.encode_image(image_file)
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }],
                max_tokens=300
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error analyzing image: {str(e)}")


def get_food_info_from_usda(food_name):
    """Fetch food information from USDA API"""
    try:
        search_url = f"{USDA_BASE_URL}/foods/search"
        params = {'api_key': USDA_API_KEY, 'query': food_name, 'dataType': ["Survey (FNDDS)"], 'pageSize': 1}
        response = requests.get(search_url, params=params)
        response.raise_for_status()

        data = response.json()
        if data['foods']:
            food = data['foods'][0]
            nutrients = food.get('foodNutrients', [])

            nutrition_info = {
                'calories': next((n['value'] for n in nutrients if n['nutrientName'] == 'Energy'), 0),
                'protein': next((n['value'] for n in nutrients if n['nutrientName'] == 'Protein'), 0),
                'carbs': next((n['value'] for n in nutrients if n['nutrientName'] == 'Carbohydrate, by difference'), 0),
                'fat': next((n['value'] for n in nutrients if n['nutrientName'] == 'Total lipid (fat)'), 0),
                'fiber': next((n['value'] for n in nutrients if n['nutrientName'] == 'Fiber, total dietary'), 0),
                'vitamins': {
                    'a': next((n['value'] for n in nutrients if 'Vitamin A' in n['nutrientName']), 0),
                    'c': next((n['value'] for n in nutrients if 'Vitamin C' in n['nutrientName']), 0),
                    'd': next((n['value'] for n in nutrients if 'Vitamin D' in n['nutrientName']), 0),
                    'e': next((n['value'] for n in nutrients if 'Vitamin E' in n['nutrientName']), 0)
                },
                'minerals': {
                    'iron': next((n['value'] for n in nutrients if 'Iron' in n['nutrientName']), 0),
                    'calcium': next((n['value'] for n in nutrients if 'Calcium' in n['nutrientName']), 0),
                    'potassium': next((n['value'] for n in nutrients if 'Potassium' in n['nutrientName']), 0)
                }
            }

            return nutrition_info
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching USDA data: {e}")
        return None


@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    """Endpoint for image analysis"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        # Initialize the image analyzer
        analyzer = ImageAnalyzer(os.getenv('OPENAI_API_KEY'))

        # Analyze the image
        image_file = request.files['image']
        food_items = analyzer.analyze_image_ML(image_file)

        # Parse the food items (assuming they're returned as a comma-separated list)
        foods = [item.strip() for item in food_items.split('\n') if item.strip()]

        # List of potentially harmful ingredients
        harmful_ingredients = ["sugar", "sodium", "trans fat", "artificial sweeteners", "MSG", "high fructose corn syrup"]

        # Get nutrition info for each identified food
        results = []
        for food in foods:
            nutrition_info = get_food_info_from_usda(food)
            if nutrition_info:
                warnings = []
                for harmful in harmful_ingredients:
                    if harmful.lower() in food.lower():
                        warnings.append(f"Contains {harmful}, which may be harmful to health.")

                food_data = {
                    'name': food,
                    'confidence': 0.95,  # Placeholder confidence score
                    'nutrition': nutrition_info,
                    'warnings': warnings
                }
                results.append(food_data)

                # Store nutrition data for recommendations
                user_nutritional_data['food_items'].append(food_data)

        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/commit', methods=['POST'])
def commit_nutrition_data():
    """Endpoint for committing food details to MongoDB."""
    try:
        # Get data from the request
        data = request.get_json()

        # Extract food data and total nutrients
        food_data = data.get('foodData', [])
        total_nutrients = data.get('totalNutrients', {})

        # Insert food data into MongoDB
        if food_data:
            food_collection.insert_many(food_data)

        # Insert total nutrients into MongoDB
        if total_nutrients:
            total_nutrients_doc = {
                "total_nutrients": total_nutrients,
                "timestamp": datetime.now()
            }
            total_nutrients_collection.insert_one(total_nutrients_doc)

        return jsonify({'message': 'Nutrition data successfully committed to MongoDB!'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to commit nutrition data. Please try again.'}), 500


@app.route('/getnutrition', methods=['GET'])
def get_nutrition_data():
    """Endpoint to get nutrition data (calories, protein, carbs, fat) from MongoDB"""
    try:
        # Query the total_nutrients collection to fetch the latest nutrition data
        total_nutrients_doc = total_nutrients_collection.find_one(sort=[("timestamp", -1)])

        if not total_nutrients_doc:
            return jsonify({'error': 'No nutrition data found in the database.'}), 404

        # Extract nutrients from the latest document
        total_nutrients = total_nutrients_doc.get("total_nutrients", {})
        nutrition_data = {
            'calories': total_nutrients.get('calories', 0),
            'protein': total_nutrients.get('protein', 0),
            'carbs': total_nutrients.get('carbs', 0),
            'fat': total_nutrients.get('fat', 0)
        }

        return jsonify(nutrition_data), 200
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve nutrition data. Please try again later.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=8000)
