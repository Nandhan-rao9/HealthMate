from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
import io
import argparse
import json
from google.cloud import vision
import requests
import google.generativeai as genai

app=Flask(__name__)

app.config["MONGO_URI"]="mongodb+srv://nandhan:ZuSVOd21Ik0Oqvxi@cluster0.opua5jp.mongodb.net/healthmate_db?retryWrites=true&w=majority&appName=Cluster0"

mongo=PyMongo(app)
bcrypt=Bcrypt(app)
CORS(app)

users_collection = mongo.db.users

@app.route("/")
def home():
    return "Flask is ON"

# register ----------

@app.route("/register",methods=["POST"])
def register():
    data=request.get_json()
    username = data.get("username")
    password=data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user={
        "username":username,
        "password": hashed_password
    }
    users_collection.insert_one(new_user)

    return jsonify({"message":"user registered successfully"}), 201


#Login-----------

@app.route("/login",methods=["POST"])
def login():
    data=request.get_json()
    username=data.get("username")
    password=data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = users_collection.find_one({"username": username})

    if user and bcrypt.check_password_hash(user["password"],password):
        return jsonify({"message": "login success"}), 200
    else:
        return jsonify({"error": "invalid pass or user"}), 401


def get_nutrition_data(food_name, usda_api_key):
    """
    Step 1: Search for the food to get its 'fdcId'.
    Step 2: Use the 'fdcId' to get its detailed nutritional info.
    """
    print(f"--- [USDA API] Searching for: {food_name} ---")
    
    # --- Step 1: Search for the food ---
    search_response = requests.get(
        'https://api.nal.usda.gov/fdc/v1/foods/search',
        params={'api_key': usda_api_key, 'query': food_name, 'pageSize': 1}
    )
    
    if search_response.status_code != 200:
        print(f"Error searching for {food_name}: {search_response.text}")
        return None

    search_data = search_response.json()
    
    if not search_data.get('foods') or len(search_data['foods']) == 0:
        print(f"No results found for {food_name}")
        return None

    # Get the FDC ID of the *first* search result
    fdcId = search_data['foods'][0].get('fdcId')
    actual_food_name = search_data['foods'][0].get('description')
    print(f"--- [USDA API] Found ID: {fdcId} ({actual_food_name}) ---")

    # --- Step 2: Get the food's details using its FDC ID ---
    details_response = requests.get(
        f'https://api.nal.usda.gov/fdc/v1/food/{fdcId}',
        params={'api_key': usda_api_key}
    )
    
    if details_response.status_code != 200:
        print(f"Error getting details for {fdcId}: {details_response.text}")
        return None
        
    details_data = details_response.json()
    
    # --- Step 3: Extract the specific nutrients we care about ---
    nutrients = {}
    # We use nutrient "numbers" which are standard IDs
    nutrient_ids = {
        'calories': '1008',  # Energy (kcal)
        'protein': '1003',   # Protein (g)
        'fat': '1004',       # Total lipid (fat) (g)
        'carbs': '1005'      # Carbohydrate (g)
    }

    for nutrient in details_data.get('foodNutrients', []):
        num = nutrient.get('nutrient', {}).get('number')
        if num in nutrient_ids.values():
            key = [k for k, v in nutrient_ids.items() if v == num][0]
            nutrients[key] = {
                'amount': nutrient.get('amount', 0),
                'unit': nutrient.get('nutrient', {}).get('unitName', '').lower()
            }
            
    return {
        'food_name': actual_food_name,
        'fdcId': fdcId,
        'serving_size_100g': True, # USDA data is per 100g by default
        'nutrients': nutrients
    }

# --- NEW FLASK ENDPOINT ---

@app.route('/get_nutrition', methods=['POST'])
def get_nutrition_endpoint():
    # 1. Get the list of food names from the request
    data = request.get_json()
    food_list = data.get('foods')
    
    if not food_list or not isinstance(food_list, list):
        return jsonify({"error": "Request must include a JSON list of 'foods'"}), 400

    # 2. Get the USDA API Key from environment
    usda_api_key = os.environ.get('USDA_API_KEY')
    if not usda_api_key:
        print("Error: USDA_API_KEY environment variable not set.")
        return jsonify({"error": "Server is not configured for nutrition lookup"}), 500

    # 3. Loop and fetch data for each food
    nutrition_results = []
    for food_name in food_list:
        nutrition_data = get_nutrition_data(food_name, usda_api_key)
        if nutrition_data:
            nutrition_results.append(nutrition_data)
        else:
            nutrition_results.append({
                'food_name': food_name,
                'error': 'No nutrition data found'
            })
            
    # 4. Return the compiled results
    return jsonify({"nutrition_data": nutrition_results})

if __name__ == "__main__":
    app.run(debug=True)