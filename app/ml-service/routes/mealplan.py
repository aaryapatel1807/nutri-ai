from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import random

router = APIRouter()

# Load recipes data
def load_recipes():
    try:
        with open("data/recipes.json", "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load recipes: {str(e)}")

def smart_pick_meal(recipes, meal_type, target_calories, used_recipes):
    """Smart meal selection based on calorie targets and constraints"""
    # Filter by meal type and avoid used recipes
    available = [
        r for r in recipes 
        if r.get("meal_type") == meal_type and r["id"] not in used_recipes
    ]
    
    if not available:
        # Fallback to any recipe of this meal type
        available = [r for r in recipes if r.get("meal_type") == meal_type]
    
    if not available:
        # Final fallback - any recipe
        available = recipes
    
    # Sort by how close calories are to target
    available.sort(key=lambda x: abs(x["nutrition_per_serving"]["calories"] - target_calories))
    
    # Pick from top 3 closest options
    top_options = available[:3] if len(available) >= 3 else available
    selected = random.choice(top_options)
    
    return selected

@router.post("/mealplan")
async def generate_meal_plan(request: dict):
    try:
        calorie_goal = request.get("calorie_goal", 1800)
        protein_goal = request.get("protein_goal", 150)
        diet_type = request.get("diet_type")
        
        # Load recipes
        recipes = load_recipes()
        
        # Filter by diet type if specified
        if diet_type:
            recipes = [r for r in recipes if r.get("diet_type") == diet_type]
        
        if not recipes:
            raise HTTPException(status_code=400, detail=f"No recipes found for diet type: {diet_type}")
        
        # Define meal calorie distribution
        meal_targets = {
            "breakfast": calorie_goal * 0.25,
            "lunch": calorie_goal * 0.35,
            "dinner": calorie_goal * 0.30,
            "snack": calorie_goal * 0.10
        }
        
        # Generate 7-day plan
        meal_plan = {}
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        for day in days_of_week:
            day_meals = {}
            used_recipes = set()
            total_calories = 0
            total_protein = 0
            
            # Generate meals for each meal type
            for meal_type, target_cal in meal_targets.items():
                meal = smart_pick_meal(recipes, meal_type, target_cal, used_recipes)
                
                # Calculate nutrition (multiply by servings if needed)
                servings = max(1, round(target_cal / meal["nutrition_per_serving"]["calories"]))
                nutrition = {
                    "calories": meal["nutrition_per_serving"]["calories"] * servings,
                    "protein": meal["nutrition_per_serving"].get("protein", 0) * servings,
                    "carbs": meal["nutrition_per_serving"].get("carbs", 0) * servings,
                    "fat": meal["nutrition_per_serving"].get("fat", 0) * servings
                }
                
                day_meals[meal_type] = {
                    "id": meal["id"],
                    "name": meal["name"],
                    "image_url": meal["image_url"],
                    "cuisine": meal["cuisine"],
                    "cook_time_min": meal["cook_time_min"],
                    "servings": servings,
                    "nutrition": nutrition,
                    "ingredients": meal["ingredients"],
                    "steps": meal["steps"]
                }
                
                used_recipes.add(meal["id"])
                total_calories += nutrition["calories"]
                total_protein += nutrition["protein"]
            
            meal_plan[day] = {
                "meals": day_meals,
                "total_calories": round(total_calories),
                "total_protein": round(total_protein),
                "hit_calorie_goal": abs(total_calories - calorie_goal) <= 100,
                "hit_protein_goal": total_protein >= protein_goal * 0.9
            }
        
        # Calculate weekly totals
        weekly_totals = {
            "total_calories": sum(day["total_calories"] for day in meal_plan.values()),
            "total_protein": sum(day["total_protein"] for day in meal_plan.values()),
            "avg_daily_calories": round(sum(day["total_calories"] for day in meal_plan.values()) / 7),
            "avg_daily_protein": round(sum(day["total_protein"] for day in meal_plan.values()) / 7),
            "days_hit_calorie_goal": sum(1 for day in meal_plan.values() if day["hit_calorie_goal"]),
            "days_hit_protein_goal": sum(1 for day in meal_plan.values() if day["hit_protein_goal"])
        }
        
        return {
            "success": True,
            "meal_plan": meal_plan,
            "weekly_totals": weekly_totals,
            "targets": {
                "daily_calories": calorie_goal,
                "daily_protein": protein_goal,
                "diet_type": diet_type
            },
            "recipe_variety": {
                "unique_recipes": len(set(
                    meal["id"] 
                    for day in meal_plan.values() 
                    for meal in day["meals"].values()
                )),
                "total_meals": 28  # 7 days × 4 meals
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Meal plan generation failed: {str(e)}"
        )
