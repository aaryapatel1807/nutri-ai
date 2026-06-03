import json
import random
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class MealPlanOptimizer:
    def __init__(self):
        self.recipe_database = self._load_recipes()
        self.nutrition_targets = self._load_nutrition_targets()
        
    def _load_recipes(self) -> List[Dict]:
        """
        Load recipe database
        """
        try:
            with open('data/recipes.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return self._get_mock_recipes()
    
    def _get_mock_recipes(self) -> List[Dict]:
        """
        Get mock recipe data
        """
        return [
            {
                "id": "omelette",
                "name": "Vegetable Omelette",
                "meal_type": "breakfast",
                "calories": 280,
                "protein": 18,
                "carbs": 12,
                "fat": 16,
                "ingredients": ["eggs", "vegetables", "cheese"],
                "prep_time": 15,
                "dietary_tags": ["high-protein"]
            },
            {
                "id": "chicken_salad",
                "name": "Grilled Chicken Salad",
                "meal_type": "lunch",
                "calories": 350,
                "protein": 35,
                "carbs": 15,
                "fat": 18,
                "ingredients": ["chicken", "lettuce", "vegetables"],
                "prep_time": 20,
                "dietary_tags": ["high-protein", "low-carb"]
            },
            {
                "id": "pasta",
                "name": "Whole Wheat Pasta",
                "meal_type": "dinner",
                "calories": 420,
                "protein": 15,
                "carbs": 60,
                "fat": 12,
                "ingredients": ["pasta", "tomato_sauce", "vegetables"],
                "prep_time": 25,
                "dietary_tags": ["vegetarian"]
            }
        ]
    
    def _load_nutrition_targets(self) -> Dict:
        """
        Load nutrition target guidelines
        """
        return {
            "male": {
                "sedentary": {"calories": 2000, "protein": 56, "carbs": 250, "fat": 65},
                "moderate": {"calories": 2600, "protein": 73, "carbs": 325, "fat": 85},
                "active": {"calories": 3000, "protein": 84, "carbs": 375, "fat": 98}
            },
            "female": {
                "sedentary": {"calories": 1600, "protein": 46, "carbs": 200, "fat": 52},
                "moderate": {"calories": 2000, "protein": 58, "carbs": 250, "fat": 65},
                "active": {"calories": 2400, "protein": 69, "carbs": 300, "fat": 78}
            }
        }
    
    async def generate_meal_plan(self, user_profile: Dict, nutrition_goals: Dict,
                               dietary_restrictions: List[str] = [],
                               preferences: Dict = {},
                               duration: int = 7) -> Dict:
        """
        Generate optimized meal plan
        """
        try:
            # Calculate daily nutrition targets
            daily_targets = self._calculate_daily_targets(user_profile, nutrition_goals)
            
            # Filter recipes based on restrictions
            suitable_recipes = self._filter_recipes(dietary_restrictions, preferences)
            
            # Generate meal plan for each day
            meal_plan = []
            total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
            
            for day in range(duration):
                daily_plan = self._generate_daily_meals(
                    suitable_recipes, daily_targets, day
                )
                meal_plan.append(daily_plan)
                
                # Track total nutrition
                for meal in daily_plan["meals"]:
                    total_nutrition["calories"] += meal["calories"]
                    total_nutrition["protein"] += meal["protein"]
                    total_nutrition["carbs"] += meal["carbs"]
                    total_nutrition["fat"] += meal["fat"]
            
            # Generate shopping list
            shopping_list = self._generate_shopping_list(meal_plan)
            
            # Calculate nutrition summary
            nutrition_summary = {
                "daily_average": {
                    "calories": total_nutrition["calories"] / duration,
                    "protein": total_nutrition["protein"] / duration,
                    "carbs": total_nutrition["carbs"] / duration,
                    "fat": total_nutrition["fat"] / duration
                },
                "target_comparison": self._compare_to_targets(
                    total_nutrition, daily_targets, duration
                )
            }
            
            return {
                "meal_plan": meal_plan,
                "nutrition_summary": nutrition_summary,
                "shopping_list": shopping_list,
                "duration": duration,
                "optimization_score": self._calculate_optimization_score(
                    nutrition_summary, daily_targets
                )
            }
            
        except Exception as e:
            raise Exception(f"Meal plan generation failed: {str(e)}")
    
    def _calculate_daily_targets(self, user_profile: Dict, nutrition_goals: Dict) -> Dict:
        """
        Calculate daily nutrition targets
        """
        gender = user_profile.get("gender", "male")
        activity_level = user_profile.get("activity_level", "moderate")
        
        # Get base targets
        base_targets = self.nutrition_targets[gender][activity_level]
        
        # Apply custom goals
        targets = base_targets.copy()
        
        if nutrition_goals.get("target_calories"):
            targets["calories"] = nutrition_goals["target_calories"]
        
        if nutrition_goals.get("target_protein"):
            targets["protein"] = nutrition_goals["target_protein"]
        
        # Adjust for weight goals
        weight_goal = nutrition_goals.get("weight_goal", "maintain")
        if weight_goal == "lose":
            targets["calories"] *= 0.85  # 15% deficit
        elif weight_goal == "gain":
            targets["calories"] *= 1.15  # 15% surplus
        
        return targets
    
    def _filter_recipes(self, restrictions: List[str], preferences: Dict) -> List[Dict]:
        """
        Filter recipes based on dietary restrictions and preferences
        """
        filtered = []
        
        for recipe in self.recipes:
            # Check dietary restrictions
            recipe_tags = set(recipe.get("dietary_tags", []))
            restriction_set = set(restrictions)
            
            # If restrictions are specified, recipe must meet all of them
            if restrictions and not restriction_set.issubset(recipe_tags):
                continue
            
            # Check preferences
            if preferences.get("max_calories_per_meal"):
                if recipe.get("calories", 0) > preferences["max_calories_per_meal"]:
                    continue
            
            if preferences.get("max_prep_time"):
                if recipe.get("prep_time", 0) > preferences["max_prep_time"]:
                    continue
            
            filtered.append(recipe)
        
        return filtered
    
    def _generate_daily_meals(self, recipes: List[Dict], targets: Dict, day_index: int) -> Dict:
        """
        Generate meals for a single day
        """
        meals = []
        meal_types = ["breakfast", "lunch", "dinner", "snack"]
        
        # Distribute calories across meals
        calorie_distribution = {
            "breakfast": 0.25,
            "lunch": 0.35,
            "dinner": 0.30,
            "snack": 0.10
        }
        
        for meal_type in meal_types:
            target_calories = targets["calories"] * calorie_distribution[meal_type]
            
            # Find suitable recipe
            suitable_recipes = [
                r for r in recipes if r.get("meal_type") == meal_type
            ]
            
            if suitable_recipes:
                # Select recipe closest to target calories
                selected = min(
                    suitable_recipes,
                    key=lambda r: abs(r.get("calories", 0) - target_calories)
                )
                
                meals.append({
                    "meal_type": meal_type,
                    "recipe": selected,
                    "calories": selected.get("calories", 0),
                    "protein": selected.get("protein", 0),
                    "carbs": selected.get("carbs", 0),
                    "fat": selected.get("fat", 0)
                })
            else:
                # Fallback meal
                meals.append({
                    "meal_type": meal_type,
                    "recipe": {"name": f"Custom {meal_type.title()}"},
                    "calories": int(target_calories),
                    "protein": int(target_calories * 0.15 / 4),  # 15% protein
                    "carbs": int(target_calories * 0.50 / 4),   # 50% carbs
                    "fat": int(target_calories * 0.35 / 9)      # 35% fat
                })
        
        return {
            "day": day_index + 1,
            "date": (datetime.now() + timedelta(days=day_index)).strftime("%Y-%m-%d"),
            "meals": meals
        }
    
    def _generate_shopping_list(self, meal_plan: List[Dict]) -> List[str]:
        """
        Generate shopping list from meal plan
        """
        ingredient_counts = {}
        
        for day_plan in meal_plan:
            for meal in day_plan["meals"]:
                recipe = meal.get("recipe", {})
                ingredients = recipe.get("ingredients", [])
                
                for ingredient in ingredients:
                    ingredient_counts[ingredient] = ingredient_counts.get(ingredient, 0) + 1
        
        # Sort by frequency
        shopping_list = sorted(
            ingredient_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [item[0] for item in shopping_list]
    
    def _compare_to_targets(self, total_nutrition: Dict, targets: Dict, duration: int) -> Dict:
        """
        Compare actual nutrition to targets
        """
        actual_daily = {
            nutrient: total_nutrition[nutrient] / duration
            for nutrient in total_nutrition
        }
        
        comparison = {}
        for nutrient in targets:
            actual = actual_daily.get(nutrient, 0)
            target = targets[nutrient]
            
            comparison[nutrient] = {
                "actual": round(actual, 1),
                "target": target,
                "percentage": round((actual / target) * 100, 1) if target > 0 else 0,
                "status": "on_track" if 0.9 <= actual / target <= 1.1 else "off_track"
            }
        
        return comparison
    
    def _calculate_optimization_score(self, nutrition_summary: Dict, targets: Dict) -> float:
        """
        Calculate how well the meal plan meets targets
        """
        target_comparison = nutrition_summary.get("target_comparison", {})
        
        scores = []
        for nutrient_data in target_comparison.values():
            percentage = nutrient_data.get("percentage", 0)
            # Score based on how close to 100%
            score = max(0, 100 - abs(percentage - 100))
            scores.append(score)
        
        return round(sum(scores) / len(scores), 2) if scores else 0.0
    
    async def optimize_plan(self, existing_plan: Dict) -> Dict:
        """
        Optimize existing meal plan
        """
        try:
            # Analyze current plan
            current_nutrition = existing_plan.get("nutrition_summary", {})
            areas_for_improvement = []
            
            # Identify improvement areas
            target_comparison = current_nutrition.get("target_comparison", {})
            for nutrient, data in target_comparison.items():
                if data.get("status") == "off_track":
                    areas_for_improvement.append(nutrient)
            
            # Generate optimized plan
            optimized_plan = existing_plan.copy()
            optimizations = []
            
            for nutrient in areas_for_improvement:
                if nutrient == "protein" and target_comparison[nutrient]["percentage"] < 90:
                    optimizations.append("Increased high-protein foods")
                elif nutrient == "carbs" and target_comparison[nutrient]["percentage"] > 110:
                    optimizations.append("Reduced high-carb foods")
                elif nutrient == "fat" and target_comparison[nutrient]["percentage"] > 110:
                    optimizations.append("Reduced high-fat foods")
            
            optimized_plan["improvements"] = optimizations
            
            return optimized_plan
            
        except Exception as e:
            raise Exception(f"Plan optimization failed: {str(e)}")
    
    async def get_templates(self) -> List[Dict]:
        """
        Get pre-defined meal plan templates
        """
        return [
            {
                "id": "weight_loss",
                "name": "Weight Loss Plan",
                "description": "Balanced meal plan for sustainable weight loss",
                "duration": 7,
                "target_calories": 1800,
                "focus": "calorie_deficit"
            },
            {
                "id": "muscle_gain",
                "name": "Muscle Building Plan",
                "description": "High-protein meal plan for muscle gain",
                "duration": 7,
                "target_calories": 2800,
                "focus": "protein_intake"
            },
            {
                "id": "balanced",
                "name": "Balanced Nutrition",
                "description": "Well-rounded meal plan for general health",
                "duration": 7,
                "target_calories": 2200,
                "focus": "macronutrient_balance"
            }
        ]
