from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
import random
from PIL import Image
import json

router = APIRouter()

# Mock food database with realistic nutrition values
FOOD_DATABASE = {
    "pizza": {"calories": 285, "protein": 12, "carbs": 36, "fat": 10},
    "salad": {"calories": 120, "protein": 8, "carbs": 15, "fat": 5},
    "rice": {"calories": 206, "protein": 4, "carbs": 45, "fat": 1},
    "chicken": {"calories": 335, "protein": 62, "carbs": 0, "fat": 7},
    "eggs": {"calories": 155, "protein": 13, "carbs": 1, "fat": 11},
    "oatmeal": {"calories": 307, "protein": 10, "carbs": 54, "fat": 5},
    "banana": {"calories": 89, "protein": 1, "carbs": 23, "fat": 0},
    "bread": {"calories": 265, "protein": 9, "carbs": 49, "fat": 3},
    "pasta": {"calories": 371, "protein": 13, "carbs": 75, "fat": 1},
    "curry": {"calories": 180, "protein": 8, "carbs": 15, "fat": 11},
    "burger": {"calories": 540, "protein": 25, "carbs": 45, "fat": 32},
    "sandwich": {"calories": 320, "protein": 18, "carbs": 35, "fat": 12},
    "soup": {"calories": 95, "protein": 6, "carbs": 12, "fat": 3},
    "steak": {"calories": 679, "protein": 62, "carbs": 0, "fat": 48},
    "fish": {"calories": 206, "protein": 22, "carbs": 0, "fat": 12},
    "vegetables": {"calories": 85, "protein": 4, "carbs": 17, "fat": 1},
    "fruit": {"calories": 75, "protein": 1, "carbs": 19, "fat": 0},
    "nuts": {"calories": 607, "protein": 20, "carbs": 21, "fat": 54},
    "yogurt": {"calories": 149, "protein": 15, "carbs": 17, "fat": 4},
    "cheese": {"calories": 402, "protein": 25, "carbs": 1, "fat": 33}
}

@router.post("/detect")
async def detect_food(file: UploadFile = File(...)):
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            # Write uploaded file to temp location
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Verify it's a valid image
        try:
            with Image.open(temp_file_path) as img:
                img.verify()
        except Exception:
            os.unlink(temp_file_path)
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Mock detection - randomly select 2-3 foods from database
        food_items = list(FOOD_DATABASE.keys())
        detected_foods = random.sample(food_items, random.randint(2, 3))
        
        # Build response with nutrition data
        results = []
        for food in detected_foods:
            nutrition = FOOD_DATABASE[food]
            results.append({
                "name": food.title(),
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "nutrition": nutrition,
                "serving_size": "100g"
            })
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return {
            "success": True,
            "foods": results,
            "total_calories": sum(food["nutrition"]["calories"] for food in results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Food detection failed: {str(e)}"
        )
