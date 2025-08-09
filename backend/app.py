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


class MentalHealthChatbot:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.system_prompt = """
        You are a compassionate and professional mental health expert. Your role is to:
        1. Listen to the user's concerns with empathy and understanding.
        2. Offer emotional validation and reassurance.
        3. Provide coping strategies and self-care techniques.
        4. Recognize signs of mental health distress or crisis, and gently guide the user toward professional help when necessary.

        Important guidelines:
        - Always maintain a supportive and non-judgmental tone.
        - Do not provide medical diagnoses or offer harmful advice.
        - Offer emotional validation and encourage self-care without judgment.
        - If the user mentions suicidal thoughts or severe distress, provide resources for professional help and contact emergency services if necessary.
        - Respect the user's privacy and confidentiality.
        - Ensure responses are emotionally sensitive and encouraging.
        """

    def generate_response(self, user_message: str) -> str:
        """Generate a supportive response from OpenAI GPT-3/4 model with a focus on mental health expertise"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",  # Use the appropriate model
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=200
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

    def handle_crisis_indicators(self, message: str) -> bool:
        """Check for crisis indicators in the user's message and provide immediate crisis intervention resources"""
        crisis_keywords = ["suicide", "harm", "death", "self-harm", "hopeless", "worthless", "ending it", "I want to die"]
        return any(keyword in message.lower() for keyword in crisis_keywords)

    def get_crisis_resources(self) -> str:
        """Return crisis resources if a user shows signs of being in immediate danger"""
        return """
        I'm really sorry that you're feeling this way. Your safety and well-being are so important, and I strongly encourage you to talk to someone who can provide more specialized support.
        Please reach out to a counselor, therapist, or someone you trust. If you're in immediate danger, please contact emergency services.
        Here are some resources you can reach out to:
        - National Suicide Prevention Lifeline: 1-800-273-8255 (USA)
        - Text HOME to 741741 to connect with a Crisis Text Line counselor (USA)
        - If you're outside of the USA, please reach out to a local crisis helpline.
        You are not alone, and there is support available for you.
        """

    def chat(self, user_message: str) -> str:
        """Main chat function to process the user's message with a compassionate mental health response"""
        if self.handle_crisis_indicators(user_message):
            return self.get_crisis_resources()
        
        # Provide supportive responses based on the user's emotional state
        response = self.generate_response(user_message)
        
        if "sad" in user_message.lower():
            response = """
            I'm really sorry you're feeling sad. It's completely okay to feel this way sometimes—emotions are a natural part of being human. 
            It might help to talk about what’s on your mind, or even engage in something that brings you comfort. 
            Sometimes, simple acts like taking a walk, doing something creative, or even reaching out to a friend can help you feel a bit better.
            Remember, you're not alone in this, and it's okay to ask for support when you need it.
            """
        
        elif "stressed" in user_message.lower():
            response = """
            Stress can feel overwhelming, but it's also something that can be managed with the right tools. 
            Take a deep breath and try to focus on one thing at a time. Sometimes it can help to break things down into smaller tasks or take short breaks.
            Be kind to yourself, and remember that it's okay to ask for help or talk about what's stressing you out.
            You're doing the best you can, and that's enough.
            """
        
        elif "overwhelmed" in user_message.lower():
            response = """
            It sounds like you're feeling overwhelmed, which is completely understandable. It’s important to recognize when things feel like too much. 
            Try to take a step back and give yourself some space to breathe. Small moments of self-care, like resting or doing something you enjoy, can make a difference.
            You're strong for recognizing how you feel, and you're capable of finding ways to navigate through this.
            """
        
        return response

        self.client = OpenAI(api_key=api_key)
        self.system_prompt = """
        You are a compassionate and professional mental health expert. Your goal is to:
        1. Listen to the user's concerns with empathy and understanding.
        2. Offer support, reassurance, and validation of their emotions.
        3. Provide suggestions for self-care and coping strategies when appropriate.
        4. Recognize signs of mental health distress or crisis and suggest professional help when necessary.

        Important guidelines:
        - Always maintain a supportive and non-judgmental tone.
        - Do not provide medical diagnoses.
        - Never minimize or dismiss the user's feelings or concerns.
        - Recognize serious mental health issues (e.g., suicidal thoughts, self-harm, or trauma) and provide crisis resources.
        - If the user is in distress, guide them towards professional help, such as a therapist or counselor.
        - Respect the user's privacy and confidentiality.
        - Be mindful of the fact that the user may be experiencing emotional or psychological challenges, so ensure your responses are sensitive.
        """

    
        """Main chat function to process the user's message with a compassionate mental health response"""
        if self.handle_crisis_indicators(user_message):
            return self.get_crisis_resources()
        
        # If it's not a crisis, provide a compassionate response and coping strategies
        response = self.generate_response(user_message)
        
        # Add empathetic follow-up if the user is expressing distress
        if "feeling overwhelmed" in user_message.lower():
            response += "\n\nIt’s completely okay to feel overwhelmed at times. It's important to take things one step at a time, and remember that you're doing the best you can. Consider taking a moment to breathe deeply or engage in a calming activity to ease your mind."
        
        elif "stressed" in user_message.lower():
            response += "\n\nStress can be really challenging, and it's helpful to recognize when you need a break. Try to focus on activities that help you relax, like deep breathing, meditation, or talking to someone you trust."
        
        elif "sad" in user_message.lower():
            response += "\n\nIt's okay to feel sad sometimes, and it’s important to acknowledge your feelings. Try not to be too hard on yourself. If it helps, journaling your emotions or speaking with a close friend or professional might provide some relief."

        return response

        self.client = OpenAI(api_key=api_key)
        self.system_prompt = """
        You are a compassionate, professional mental health support chatbot. 
        Your primary goals are to:
        1. Provide empathetic and supportive responses
        2. Offer constructive coping strategies
        3. Recognize serious mental health concerns
        4. Encourage professional help when necessary

        Important guidelines:
        - Never provide medical diagnosis
        - Always prioritize user safety
        - Maintain a non-judgmental and supportive tone
        - Suggest professional help for serious mental health issues
        - Respect user privacy and confidentiality
        """

    
        """Main chat function to process the user message"""
        if self.handle_crisis_indicators(user_message):
            return self.get_crisis_resources()
        return self.generate_response(user_message)


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
        # Query the total_nutrients collection for the latest data
        total_nutrients = total_nutrients_collection.find().sort('timestamp', -1).limit(1)
        if total_nutrients:
            return jsonify([doc['total_nutrients'] for doc in total_nutrients]), 200
        else:
            return jsonify({'message': 'No nutrition data available'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to fetch nutrition data. Please try again.'}), 500


@app.route('/chat', methods=['POST'])
def chat():
    """Endpoint for mental health chatbot interaction"""
    user_message = request.json.get("message", "")
    chatbot = MentalHealthChatbot(api_key=os.getenv('OPENAI_API_KEY'))

    # Get response from the chatbot
    response = chatbot.chat(user_message)
    return jsonify({'response': response})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
