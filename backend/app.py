from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
import io # <-- Added for AI
import json
import requests
from dotenv import load_dotenv

# --- AI Imports ---
from google.cloud import vision
import google.generativeai as genai

load_dotenv() # Loads .env file for API keys

app=Flask(__name__)

# --- App Config ---
app.config["MONGO_URI"]="mongodb+srv://nandhan:ZuSVOd21Ik0Oqvxi@cluster0.opua5jp.mongodb.net/healthmate_db?retryWrites=true&w=majority&appName=Cluster0"

mongo=PyMongo(app)
bcrypt=Bcrypt(app)
CORS(app)

users_collection = mongo.db.users

# --- AI PROMPT TEMPLATE ---
PROMPT_TEMPLATE = """
You are an expert food classifier. I will give you a list of
raw labels detected from an image (with confidence scores), and a 
target number of items.
Your job is to analyze this list and return only the specific, 
distinct food dishes, prioritizing high-confidence labels.

RULES:
1.  **Analyze this list of (label, score) tuples:**
    {raw_labels_with_scores}

2.  **Filter Heavily:**
    - IGNORE generic categories (e.g., "Food", "Dish", "Meal", "Staple food", "Lunch", "Breakfast").
    - IGNORE common ingredients (e.g., "Meat", "Vegetable", "Rice", "Cheese").
    - IGNORE non-food items (e.g., "Tableware", "Platter", "Serveware", "Dishware").

3.  **Find the Most Specific, High-Confidence Items:**
    - **RULE A:** TRUST THE SCORES. A specific item with a high score 
      (like "Chicken" at 0.89) is almost always the correct answer.
    - **RULE B:** DO NOT INVENT A DISH. If you see ("Chicken", 0.89) and 
      ("White rice", 0.88), list BOTH. Do *not* combine them into 
      "Stew" if "Stew" has a much lower score (0.76).
    - **RULE C:** REMOVE REDUNDANCY. If you see ("Rice", 0.83) and 
      ("White rice", 0.88), you must *only* keep "White rice". 
      If you see "Salad" and "Greek salad", keep "Greek salad".

4.  **Format the Output:**
    - Return a JSON list of strings.
    - The list should contain the top {item_count} most prominent, distinct 
      dishes, sorted by their original confidence score.
    - If no specific dishes are found, return an empty list [].

JSON Response:
"""

# --- AUTH ENDPOINTS ---

@app.route("/")
def home():
    return "Flask is ON"

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

# --- AI HELPER FUNCTIONS ---

def get_raw_labels_from_vision(image_content): # <-- CHANGED from image_path
    """
    Step 1: Use Google Vision API to get a raw list of (label, score) tuples.
    Accepts image content (bytes) directly.
    """
    print("--- [Vision API] Processing image content ---")
    
    try:
        # This is from your script. It works, so we'll keep it.
        # Make sure 'credentials.json' is in your backend folder.
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'credentials.json'
        client = vision.ImageAnnotatorClient()
    except Exception as e:
        print(f"Error: Could not initialize Vision client. {e}")
        return []

    try:
        # Use the image_content bytes directly
        image = vision.Image(content=image_content)
        response = client.label_detection(image=image)
        
        if response.error.message:
            print(f"Vision API Error: {response.error.message}")
            return []
            
        label_data = []
        for label in response.label_annotations:
            label_data.append((label.description, round(label.score, 2)))
        return label_data
        
    except Exception as e:
        print(f"Error during Vision API call: {e}")
        return []

def filter_labels_with_gemini(raw_labels_with_scores, item_count):
    """
    Step 2: Use Gemini and a prompt template to filter the raw list.
    (Copied directly from your script)
    """
    print("--- [Gemini LLM] Filtering raw labels... ---")
    
    try:
        api_key = os.environ.get('GEMINI_API_KEY') # Loaded from .env
        if not api_key:
            print("Error: GEMINI_API_KEY environment variable not set.")
            return []
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"Error: Could not configure Gemini. {e}")
        return []
        
    YOUR_MODEL_NAME = "models/gemini-2.5-flash" 
    
    print(f"--- [Gemini LLM] Using model: {YOUR_MODEL_NAME} ---")
    model = genai.GenerativeModel(YOUR_MODEL_NAME)
    
    prompt = PROMPT_TEMPLATE.format(
        raw_labels_with_scores=raw_labels_with_scores, 
        item_count=item_count
    )
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip().lstrip("```json").rstrip("```").strip()
        
        final_list = json.loads(response_text)
        return final_list
        
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        try:
            print(f"Raw response was: {response.text}")
        except NameError:
            pass 
        return []

# --- AI ENDPOINT ---

@app.route("/identify", methods=["POST"])
def identify_food_endpoint():
    # 1. Check for the image file
    if 'file' not in request.files:
        return jsonify({"error": "No 'file' part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # 2. Get the item count (default to 3)
    try:
        # We'll ask for 3 items by default to get more options
        item_count = int(request.form.get('count', 3)) 
    except ValueError:
        return jsonify({"error": "'count' must be an integer"}), 400

    # 3. Read image content
    try:
        image_content = file.read()
    except Exception as e:
        return jsonify({"error": f"Could not read file: {e}"}), 500

    # 4. Run the 2-step AI pipeline
    raw_labels = get_raw_labels_from_vision(image_content)
    
    if not raw_labels:
        return jsonify({"error": "Could not analyze image. Vision API returned no labels."}), 500
        
    final_dishes = filter_labels_with_gemini(raw_labels, item_count)
    
    # 5. Return the final list of food names
    return jsonify({
        "detected_dishes": final_dishes,
        "raw_labels_for_debug": raw_labels
    })

# --- NUTRITION HELPER FUNCTION ---

def get_nutrition_data(food_name, quantity_g, usda_api_key):
    """
    Fetches nutrient data from USDA and scales it to the requested quantity.
    """
    print(f"🔎 Fetching data for {quantity_g}g of {food_name}")

    if not usda_api_key:
        print("❌ Error: USDA_API_KEY missing.")
        return None
    
    try:
        search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        search_params = {"api_key": usda_api_key, "query": food_name, "pageSize": 1}
        search_response = requests.get(search_url, params=search_params)
        search_response.raise_for_status() 
        search_data = search_response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Search error: {e}")
        return None

    if "foods" not in search_data or len(search_data["foods"]) == 0:
        print(f"❌ No results found for {food_name}")
        return None

    fdc_id = search_data["foods"][0]["fdcId"]
    actual_name = search_data["foods"][0]["description"]
    print(f"✅ Found '{actual_name}' (FDC ID: {fdc_id})")
    
    try:
        details_url = f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}"
        details_params = {"api_key": usda_api_key}
        details_response = requests.get(details_url, params=details_params)
        details_response.raise_for_status()
        details_data = details_response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Details error: {e}")
        return None
    
    nutrient_map = {
        1008: "calories", 1003: "protein", 1004: "fat", 1005: "carbohydrates",
        1087: "calcium", 1089: "iron", 1090: "magnesium", 1095: "zinc",
        1106: "vitamin_a", 1110: "vitamin_d", 1109: "vitamin_e", 1162: "vitamin_c",
    }
    
    scaling_factor = quantity_g / 100.0
    calculated_nutrients = {}

    for nutrient in details_data.get("foodNutrients", []):
        nid = (
            nutrient.get("nutrient", {}).get("id") or
            nutrient.get("nutrient", {}).get("number")
        )
        
        if nid in nutrient_map:
            name = nutrient_map[nid]
            amount_per_100g = nutrient.get("amount") or nutrient.get("value") or 0
            unit = nutrient.get("nutrient", {}).get("unitName") or ""
            scaled_amount = amount_per_100g * scaling_factor
            calculated_nutrients[name] = {
                "amount": round(scaled_amount, 2),
                "unit": unit.lower()
            }

    return {
        "food_name": actual_name,
        "fdcId": fdc_id,
        "requested_quantity_g": quantity_g,
        "nutrients": calculated_nutrients
    }

# --- NUTRITION ENDPOINT ---

@app.route("/get_nutrition", methods=["POST"])
def get_nutrition_endpoint():
    data = request.get_json()
    food_name = data.get("food_name")
    
    try:
        quantity_g = float(data.get("quantity_g", 100.0))
    except ValueError:
        return jsonify({"error": "Invalid quantity. Must be a number."}), 400

    if not food_name:
        return jsonify({"error": "food_name is required"}), 400

    usda_api_key = os.environ.get("USDA_API_KEY") # Loaded from .env
    if not usda_api_key:
        print("❌ Critical Error: USDA_API_KEY environment variable not set on server.")
        return jsonify({"error": "Server configuration error"}), 500

    nutrition_data = get_nutrition_data(food_name, quantity_g, usda_api_key)

    if not nutrition_data:
        return jsonify({"error": f"No nutrition data found for '{food_name}'"}), 404
        
    return jsonify(nutrition_data), 200

# --- RUN THE SERVER ---

if __name__ == "__main__":
    app.run(debug=True)