import cv2
import numpy as np
from typing import List, Dict
import json

class FoodDetector:
    def __init__(self):
        self.model_loaded = False
        # In production, load actual ML model here
        # self.model = load_model('food_detection_model.h5')
        
    async def detect_food_items(self, image_data: bytes) -> Dict:
        """
        Detect food items from image data
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Mock detection - replace with actual ML model inference
            detected_foods = self._mock_detection(image)
            
            total_calories = sum(food['calories'] for food in detected_foods)
            
            return {
                "foods": detected_foods,
                "confidence": 0.85,
                "total_calories": total_calories,
                "nutrition": self._calculate_nutrition(detected_foods)
            }
            
        except Exception as e:
            raise Exception(f"Food detection failed: {str(e)}")
    
    def _mock_detection(self, image) -> List[Dict]:
        """
        Mock food detection - replace with actual model
        """
        # Mock detected foods for demonstration
        return [
            {
                "name": "Grilled Chicken",
                "confidence": 0.92,
                "calories": 165,
                "protein": 31,
                "carbs": 0,
                "fat": 3.6,
                "quantity": "100g",
                "bbox": [100, 100, 200, 200]
            },
            {
                "name": "Brown Rice",
                "confidence": 0.88,
                "calories": 112,
                "protein": 2.6,
                "carbs": 23,
                "fat": 0.9,
                "quantity": "100g",
                "bbox": [250, 150, 350, 250]
            }
        ]
    
    def _calculate_nutrition(self, foods: List[Dict]) -> Dict:
        """
        Calculate total nutritional information
        """
        total_nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0
        }
        
        for food in foods:
            for nutrient in total_nutrition:
                total_nutrition[nutrient] += food.get(nutrient, 0)
        
        return total_nutrition
    
    async def analyze_nutrition(self, meal_items: List[Dict]) -> Dict:
        """
        Analyze nutritional content of meal items
        """
        analysis = {
            "total_calories": sum(item.get("calories", 0) for item in meal_items),
            "macronutrients": {
                "protein": sum(item.get("protein", 0) for item in meal_items),
                "carbs": sum(item.get("carbs", 0) for item in meal_items),
                "fat": sum(item.get("fat", 0) for item in meal_items)
            },
            "health_score": self._calculate_health_score(meal_items),
            "recommendations": []
        }
        
        return analysis
    
    def _calculate_health_score(self, meal_items: List[Dict]) -> float:
        """
        Calculate health score based on nutritional balance
        """
        total_calories = sum(item.get("calories", 0) for item in meal_items)
        total_protein = sum(item.get("protein", 0) for item in meal_items)
        
        # Simple scoring algorithm
        protein_ratio = (total_protein * 4) / total_calories if total_calories > 0 else 0
        score = min(100, protein_ratio * 100)
        
        return round(score, 2)
    
    def get_recommendations(self, analysis: Dict) -> List[str]:
        """
        Get nutrition recommendations based on analysis
        """
        recommendations = []
        
        if analysis["health_score"] < 70:
            recommendations.append("Consider adding more protein-rich foods")
        
        if analysis["macronutrients"]["carbs"] > 100:
            recommendations.append("Consider reducing carbohydrate intake")
        
        return recommendations
