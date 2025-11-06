from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv

load_dotenv() # Load environment variables

# --- FLASK SETUP & CONFIG ---
app = Flask(__name__)
# Load MONGO_URI from environment variables or use the hardcoded string
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb+srv://nandhan:ZuSVOd21Ik0Oqvxi@cluster0.opua5jp.mongodb.net/healthmate_db?retryWrites=true&w=majority&appName=Cluster0")

mongo = PyMongo(app)
bcrypt = Bcrypt(app)
CORS(app) # Enable CORS for frontend communication

users_collection = mongo.db.users
profile_collection = mongo.db.profiles # Separate collection for detailed profile data

# --- HELPER FUNCTIONS ---

def calculate_goals(data):
    """
    Calculates BMR, TDEE, and Target Calories based on user input.
    Uses the Mifflin-St Jeor Equation for BMR (simplified version).
    """
    try:
        gender = data.get('gender')
        age = int(data.get('age'))
        weight_kg = float(data.get('weight'))
        height_cm = float(data.get('height'))
        activity_level = data.get('activityLevel')
        goal = data.get('goal')
        
        # 1. BMR Calculation (Mifflin-St Jeor)
        if gender == 'male':
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
        else: # female
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
            
        # 2. TDEE Calculation (BMR * Activity Multiplier)
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9,
        }
        tdee = bmr * activity_multipliers.get(activity_level, 1.375)
        
        # 3. Target Calorie Goal Adjustment
        goal_adjustments = {
            'lose_weight': -500, # Calorie deficit
            'gain_weight': 500,  # Calorie surplus
            'maintain': 0,
            'recomp': -250, # Slight deficit for recomp
        }
        target_calories = tdee + goal_adjustments.get(goal, 0)
        
        return {
            'bmr': round(bmr),
            'tdee': round(tdee),
            'calorieGoal': round(target_calories)
        }
    
    except Exception as e:
        print(f"Goal calculation failed: {e}")
        return {'error': 'Calculation failed due to invalid input.'}


# --- AUTH ENDPOINTS ---

@app.route("/")
def home():
    return "Flask is ON (Auth & Onboarding Active)"

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "Username already exists"}), 409
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = {
        "username": username,
        "password": hashed_password,
        "profile_complete": False # Initial status is incomplete
    }
    result = users_collection.insert_one(new_user)
    
    # In a real app, generate JWT token here.
    return jsonify({
        "message": "User registered successfully", 
        "user_id": str(result.inserted_id),
        "token": "MOCK_REG_TOKEN"
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = users_collection.find_one({"username": username})

    if user and bcrypt.check_password_hash(user["password"], password):
        
        # Check profile completion status
        profile_complete = user.get("profile_complete", False)
        
        # Optionally load initial profile data if complete
        profile_data = None
        if profile_complete:
            profile_record = profile_collection.find_one({"user_id": str(user["_id"])})
            if profile_record:
                # Remove MongoDB's internal ID for cleaner response
                profile_record.pop('_id', None)
                profile_record.pop('user_id', None)
                profile_data = profile_record

        # In a real app, generate JWT token here.
        return jsonify({
            "message": "Login successful",
            "profileComplete": profile_complete,
            "profileData": profile_data,
            "token": "MOCK_LOGIN_TOKEN"
        }), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# --- ONBOARDING/PROFILE ENDPOINTS ---

@app.route("/profile/onboarding", methods=["POST"])
def save_onboarding_data():
    data = request.get_json()
    # In a real app, extract user_id from the JWT token in the header.
    # For now, we assume the client sends the username to mock authentication.
    username = data.get('username')
    
    if not username:
        return jsonify({"error": "Missing user identifier."}), 401

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found."}), 404
        
    user_id = str(user["_id"])

    # 1. Server-side validation and calculation
    goals = calculate_goals(data)
    if 'error' in goals:
        return jsonify({"error": goals['error']}), 400
        
    # 2. Prepare the full profile record
    profile_record = {
        "user_id": user_id,
        "username": username,
        "raw_data": {k: v for k, v in data.items() if k != 'username'}, # Store raw input
        "goals": goals, # Store calculated goals
        "profile_complete": True
    }

    # 3. Save/Update profile in profile_collection
    profile_collection.update_one(
        {"user_id": user_id},
        {"$set": profile_record},
        upsert=True # Insert if user_id doesn't exist, update otherwise
    )
    
    # 4. Update user's main status to profile_complete
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"profile_complete": True}}
    )

    # 5. Return the calculated goals
    return jsonify({
        'message': 'Profile saved and goals calculated.',
        'profileData': profile_record["goals"], # Send only the goals back
        'profileComplete': True
    }), 200


# --- RUN THE SERVER ---

if __name__ == "__main__":
    app.run(debug=True, port=5000)