import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def get_nutrition_data(food_name, usda_api_key):
    print(f"🔎 Fetching: {food_name}")

    if not usda_api_key:
        print("❌ Error: USDA_API_KEY missing.")
        return None

    # Step 1: Search for the food
    search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    search_params = {"api_key": usda_api_key, "query": food_name, "pageSize": 1}
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()

    if "foods" not in search_data or len(search_data["foods"]) == 0:
        print(f"❌ No results found for {food_name}")
        return None

    fdc_id = search_data["foods"][0]["fdcId"]
    actual_name = search_data["foods"][0]["description"]

    # Step 2: Get nutrient details
    details_url = f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}"
    details_response = requests.get(details_url, params={"api_key": usda_api_key})
    details_data = details_response.json()

    # Step 3: Map nutrients (add fiber 1079)
    nutrient_map = {
        1008: "calories",
        1003: "protein",
        1004: "fat",
        1005: "carbohydrates",
        1079: "fiber",
        1087: "calcium",
        1089: "iron",
        1090: "magnesium",
        1095: "zinc",
        1106: "vitamin_a",
        1110: "vitamin_d",
        1109: "vitamin_e",
        1162: "vitamin_c",
    }

    # Initialize all nutrients as 0
    nutrients = {name: {"amount_per_100g": 0, "unit": ""} for name in nutrient_map.values()}

    for nutrient in details_data.get("foodNutrients", []):
        # Try all possible keys
        nid = (
            nutrient.get("nutrient", {}).get("id") or
            nutrient.get("nutrient", {}).get("number") or
            nutrient.get("nutrientNumber")
        )
        if nid in nutrient_map:
            name = nutrient_map[nid]
            amount = nutrient.get("amount") or nutrient.get("value") or 0
            unit = nutrient.get("nutrient", {}).get("unitName") or nutrient.get("unitName") or ""
            nutrients[name] = {
                "amount_per_100g": round(amount, 2),
                "unit": unit.lower()
            }

    return {
        "food_name": actual_name,
        "fdcId": fdc_id,
        "serving_size": "100 g",
        "nutrients": nutrients
    }

if __name__ == "__main__":
    API_KEY = os.environ.get("USDA_API_KEY")
    test_foods = ["apple raw", "grilled chicken breast", "white rice"]

    for food in test_foods:
        info = get_nutrition_data(food, API_KEY)
        if info:
            print(json.dumps(info, indent=2))
        print("-" * 40)
