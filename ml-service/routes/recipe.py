from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import os
from typing import List

router = APIRouter()

# Load recipes data
def load_recipes():
    try:
        with open("data/recipes.json", "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load recipes: {str(e)}")

@router.post("/recipe-suggestions")
async def find_recipes(request: dict):
    try:
        ingredients = request.get("ingredients", [])
        diet_filter = request.get("diet_filter")
        max_cook_time = request.get("max_cook_time")
        
        if not ingredients:
            raise HTTPException(status_code=400, detail="No ingredients provided")
        
        recipes = load_recipes()
        results = []
        
        for recipe in recipes:
            # Apply diet filter if specified
            if diet_filter and recipe.get("diet_type") != diet_filter:
                continue
            
            # Apply cook time filter if specified
            if max_cook_time and recipe.get("cook_time_min", 0) > max_cook_time:
                continue
            
            # Calculate match score
            recipe_ingredients = set(recipe.get("ingredients", []))
            user_ingredients = set(ingredients)
            
            matching_ingredients = recipe_ingredients.intersection(user_ingredients)
            match_score = (len(matching_ingredients) / len(recipe_ingredients)) * 100 if recipe_ingredients else 0
            
            # Find missing ingredients
            missing_ingredients = list(recipe_ingredients - user_ingredients)
            
            # Only include recipes with at least some match
            if match_score > 0:
                results.append({
                    **recipe,
                    "match_score": round(match_score, 1),
                    "missing_ingredients": missing_ingredients,
                    "matching_ingredients": list(matching_ingredients)
                })
        
        # Sort by match score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Return top 6 results
        return {
            "success": True,
            "recipes": results[:6],
            "total_found": len(results),
            "search_params": {
                "ingredients": ingredients,
                "diet_filter": diet_filter,
                "max_cook_time": max_cook_time
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recipe search failed: {str(e)}"
        )
