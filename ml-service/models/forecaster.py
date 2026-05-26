import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class NutritionForecaster:
    def __init__(self):
        self.model_loaded = False
        # In production, load actual time series model
        # self.model = load_model('nutrition_forecast_model.pkl')
        
    async def generate_forecast(self, user_id: str, historical_data: List[Dict], 
                               target_goals: Optional[Dict] = None, days: int = 7) -> Dict:
        """
        Generate nutrition forecast for specified days
        """
        try:
            # Convert historical data to DataFrame
            df = pd.DataFrame(historical_data)
            
            # Generate mock forecast - replace with actual model
            forecast = self._generate_mock_forecast(df, days)
            
            # Apply target goals if provided
            if target_goals:
                forecast = self._apply_goals(forecast, target_goals)
            
            return {
                "forecast": forecast,
                "confidence": 0.78,
                "trend_analysis": self._analyze_trends(df),
                "goal_alignment": self._check_goal_alignment(forecast, target_goals) if target_goals else None
            }
            
        except Exception as e:
            raise Exception(f"Forecast generation failed: {str(e)}")
    
    def _generate_mock_forecast(self, df: pd.DataFrame, days: int) -> List[Dict]:
        """
        Generate mock forecast data
        """
        forecast = []
        base_date = datetime.now()
        
        # Calculate averages from historical data
        avg_calories = df['calories'].mean() if 'calories' in df.columns else 2000
        avg_protein = df['protein'].mean() if 'protein' in df.columns else 50
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            
            # Add some variation to make it realistic
            calorie_variation = np.random.normal(0, 100)
            protein_variation = np.random.normal(0, 5)
            
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_calories": max(0, avg_calories + calorie_variation),
                "predicted_protein": max(0, avg_protein + protein_variation),
                "predicted_carbs": avg_protein * 3 + np.random.normal(0, 10),
                "predicted_fat": avg_protein * 0.8 + np.random.normal(0, 5)
            })
        
        return forecast
    
    def _apply_goals(self, forecast: List[Dict], goals: Dict) -> List[Dict]:
        """
        Adjust forecast based on target goals
        """
        target_calories = goals.get('target_calories')
        if target_calories:
            for day in forecast:
                # Gradually adjust towards target
                adjustment = (target_calories - day['predicted_calories']) * 0.3
                day['predicted_calories'] += adjustment
        
        return forecast
    
    def _analyze_trends(self, df: pd.DataFrame) -> Dict:
        """
        Analyze trends in historical data
        """
        trends = {
            "calorie_trend": "stable",
            "protein_trend": "increasing",
            "consistency_score": 0.75
        }
        
        # Simple trend analysis
        if len(df) > 1:
            recent_avg = df.tail(7)['calories'].mean() if 'calories' in df.columns else 0
            older_avg = df.head(7)['calories'].mean() if 'calories' in df.columns else 0
            
            if recent_avg > older_avg * 1.1:
                trends["calorie_trend"] = "increasing"
            elif recent_avg < older_avg * 0.9:
                trends["calorie_trend"] = "decreasing"
        
        return trends
    
    def _check_goal_alignment(self, forecast: List[Dict], goals: Dict) -> Dict:
        """
        Check how well forecast aligns with goals
        """
        alignment = {
            "overall_score": 0.0,
            "calories_alignment": 0.0,
            "protein_alignment": 0.0
        }
        
        target_calories = goals.get('target_calories', 2000)
        target_protein = goals.get('target_protein', 50)
        
        # Calculate alignment scores
        avg_forecast_calories = np.mean([day['predicted_calories'] for day in forecast])
        avg_forecast_protein = np.mean([day['predicted_protein'] for day in forecast])
        
        alignment["calories_alignment"] = max(0, 1 - abs(avg_forecast_calories - target_calories) / target_calories)
        alignment["protein_alignment"] = max(0, 1 - abs(avg_forecast_protein - target_protein) / target_protein)
        alignment["overall_score"] = (alignment["calories_alignment"] + alignment["protein_alignment"]) / 2
        
        return alignment
    
    async def analyze_trends(self, user_id: str) -> Dict:
        """
        Analyze long-term nutrition trends for user
        """
        # Mock implementation - in production, fetch user data from database
        return {
            "weight_trend": "stable",
            "calorie_consistency": 0.82,
            "macro_balance": 0.75,
            "improvement_areas": ["protein intake", "meal timing"],
            "positive_patterns": ["consistent logging", "balanced macros"]
        }
    
    def get_insights(self, forecast_result: Dict) -> List[str]:
        """
        Extract insights from forecast results
        """
        insights = []
        
        if forecast_result.get("trend_analysis", {}).get("calorie_trend") == "increasing":
            insights.append("Your calorie intake has been trending upward. Consider portion control.")
        
        if forecast_result.get("goal_alignment", {}).get("overall_score", 0) < 0.7:
            insights.append("Your current trajectory may not align with your goals. Consider adjustments.")
        
        return insights
    
    def get_recommendations(self, forecast_result: Dict) -> List[str]:
        """
        Get recommendations based on forecast
        """
        recommendations = []
        
        recommendations.append("Maintain consistent meal timing")
        recommendations.append("Focus on protein-rich foods")
        recommendations.append("Monitor portion sizes")
        
        return recommendations
