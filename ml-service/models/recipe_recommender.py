import json
import numpy as np
from typing import List, Dict, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RecipeRecommender:
    def __init__(self):
        self.recipes = self._load_recipes()
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._build_index()
        
    def _load_recipes(self) -> List[Dict]:
        """
        Load recipe database
        """
        try:
            with open('data/recipes.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Return mock data if file doesn't exist
            return self._get_mock_recipes()
    
    def _get_mock_recipes(self) -> List[Dict]:
        """
        Get mock recipe data
        """
        return [
            {
                "id": "1",
                "name": "Grilled Chicken Salad",
                "ingredients": ["chicken", "lettuce", "tomato", "cucumber", "olive oil"],
                "calories": 350,
                "protein": 35,
                "carbs": 15,
                "fat": 18,
                "meal_type": "lunch",
                "dietary_tags": ["gluten-free", "high-protein"],
                "prep_time": 20,
                "cook_time": 15
            },
            {
                "id": "2",
                "name": "Quinoa Buddha Bowl",
                "ingredients": ["quinoa", "chickpeas", "avocado", "spinach", "tahini"],
                "calories": 420,
                "protein": 18,
                "carbs": 45,
                "fat": 22,
                "meal_type": "lunch",
                "dietary_tags": ["vegan", "gluten-free"],
                "prep_time": 25,
                "cook_time": 20
            }
        ]
    
    def _build_index(self):
        """
        Build search index for recipes
        """
        # Create text representation of each recipe
        recipe_texts = []
        for recipe in self.recipes:
            text = f"{recipe['name']} {' '.join(recipe['ingredients'])}"
            recipe_texts.append(text)
        
        # Fit vectorizer
        self.recipe_vectors = self.vectorizer.fit_transform(recipe_texts)
    
    async def get_recommendations(self, ingredients: List[str], 
                                dietary_restrictions: List[str] = [],
                                preferences: Dict = {},
                                meal_type: str = "any",
                                max_calories: int = 800) -> List[Dict]:
        """
        Get recipe recommendations based on ingredients and preferences
        """
        try:
            # Filter recipes based on constraints
            filtered_recipes = self._filter_recipes(
                self.recipes, dietary_restrictions, meal_type, max_calories
            )
            
            # Score recipes based on ingredient matching
            scored_recipes = self._score_recipes(filtered_recipes, ingredients, preferences)
            
            # Sort by score and return top recommendations
            scored_recipes.sort(key=lambda x: x['score'], reverse=True)
            
            return scored_recipes[:10]
            
        except Exception as e:
            raise Exception(f"Recipe recommendation failed: {str(e)}")
    
    def _filter_recipes(self, recipes: List[Dict], restrictions: List[str], 
                       meal_type: str, max_calories: int) -> List[Dict]:
        """
        Filter recipes based on constraints
        """
        filtered = []
        
        for recipe in recipes:
            # Check meal type
            if meal_type != "any" and recipe.get("meal_type") != meal_type:
                continue
            
            # Check calories
            if recipe.get("calories", 0) > max_calories:
                continue
            
            # Check dietary restrictions
            recipe_tags = set(recipe.get("dietary_tags", []))
            restriction_set = set(restrictions)
            
            # If restrictions are specified, recipe must meet all of them
            if restrictions and not restriction_set.issubset(recipe_tags):
                continue
            
            filtered.append(recipe)
        
        return filtered
    
    def _score_recipes(self, recipes: List[Dict], ingredients: List[str], 
                      preferences: Dict) -> List[Dict]:
        """
        Score recipes based on ingredient matching and preferences
        """
        ingredient_set = set(ingredients)
        
        for recipe in recipes:
            recipe_ingredients = set(recipe.get("ingredients", []))
            
            # Calculate ingredient overlap score
            overlap = len(ingredient_set.intersection(recipe_ingredients))
            total_ingredients = len(ingredient_set.union(recipe_ingredients))
            ingredient_score = overlap / total_ingredients if total_ingredients > 0 else 0
            
            # Apply preference weights
            preference_score = 0
            if preferences.get("high_protein") and recipe.get("protein", 0) > 20:
                preference_score += 0.2
            if preferences.get("low_carb") and recipe.get("carbs", 0) < 20:
                preference_score += 0.2
            
            # Final score
            recipe["score"] = ingredient_score + preference_score
        
        return recipes
    
    async def get_similar_recipes(self, recipe_id: str) -> List[Dict]:
        """
        Get recipes similar to the given recipe
        """
        try:
            # Find the recipe
            target_recipe = None
            for i, recipe in enumerate(self.recipes):
                if recipe["id"] == recipe_id:
                    target_recipe = recipe
                    target_index = i
                    break
            
            if not target_recipe:
                return []
            
            # Calculate similarity scores
            target_vector = self.recipe_vectors[target_index]
            similarities = cosine_similarity(target_vector, self.recipe_vectors).flatten()
            
            # Get top similar recipes (excluding itself)
            similar_indices = similarities.argsort()[-6:-1][::-1]
            
            similar_recipes = []
            for idx in similar_indices:
                recipe = self.recipes[idx].copy()
                recipe["similarity_score"] = float(similarities[idx])
                similar_recipes.append(recipe)
            
            return similar_recipes
            
        except Exception as e:
            raise Exception(f"Similar recipe search failed: {str(e)}")
    
    async def create_recipe(self, recipe_data: Dict) -> Dict:
        """
        Create a new recipe with AI assistance
        """
        try:
            # Generate recipe ID
            new_id = str(len(self.recipes) + 1)
            
            # Calculate nutrition (mock calculation)
            base_calories = len(recipe_data.get("ingredients", [])) * 50
            base_protein = len([ing for ing in recipe_data.get("ingredients", []) if "chicken" in ing or "beef" in ing]) * 15
            
            new_recipe = {
                "id": new_id,
                "name": recipe_data.get("name", "Custom Recipe"),
                "ingredients": recipe_data.get("ingredients", []),
                "calories": recipe_data.get("calories", base_calories),
                "protein": recipe_data.get("protein", base_protein),
                "carbs": recipe_data.get("carbs", 30),
                "fat": recipe_data.get("fat", 15),
                "meal_type": recipe_data.get("meal_type", "any"),
                "dietary_tags": recipe_data.get("dietary_tags", []),
                "prep_time": recipe_data.get("prep_time", 20),
                "cook_time": recipe_data.get("cook_time", 20)
            }
            
            # Add to recipes list
            self.recipes.append(new_recipe)
            
            # Rebuild index
            self._build_index()
            
            return new_recipe
            
        except Exception as e:
            raise Exception(f"Recipe creation failed: {str(e)}")
