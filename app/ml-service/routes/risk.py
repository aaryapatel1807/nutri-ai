from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import random

router = APIRouter()

def calculate_diabetes_risk_score(bmi, age, avg_daily_sugar, activity_level):
    """Calculate diabetes risk score (0-100)"""
    score = 0
    
    # BMI contribution
    if bmi > 30:
        score += 25
    elif bmi > 25:
        score += 10
    
    # Age contribution
    if age > 60:
        score += 25
    elif age > 45:
        score += 15
    
    # Sugar intake contribution
    if avg_daily_sugar > 100:
        score += 35
    elif avg_daily_sugar > 50:
        score += 20
    elif avg_daily_sugar > 25:
        score += 10
    
    # Activity level contribution (lower is better)
    if activity_level < 2:
        score += 15
    elif activity_level > 4:
        score -= 10  # High activity reduces risk
    
    # Add ±5 random noise for realism
    score += random.uniform(-5, 5)
    
    # Ensure score is within bounds
    return max(0, min(100, round(score)))

def get_risk_level(score):
    """Map score to risk level"""
    if score < 30:
        return "Low"
    elif score <= 60:
        return "Moderate"
    else:
        return "High"

def get_risk_color(risk_level):
    """Get color for risk level"""
    colors = {
        "Low": "#00FF87",
        "Moderate": "#FFD700", 
        "High": "#FF6B35"
    }
    return colors.get(risk_level, "#7B61FF")

def generate_recommendations(risk_level, bmi, activity_level, sugar_intake):
    """Generate personalized recommendations"""
    recommendations = []
    
    if risk_level == "High":
        recommendations.extend([
            "Consult with a healthcare provider immediately",
            "Reduce daily sugar intake to under 25g",
            "Increase physical activity to at least 150 minutes/week",
            "Consider weight management if BMI is elevated"
        ])
    elif risk_level == "Moderate":
        recommendations.extend([
            "Monitor blood sugar levels regularly",
            "Limit added sugars and refined carbohydrates",
            "Aim for 30 minutes of moderate exercise daily",
            "Maintain a healthy weight"
        ])
    else:  # Low risk
        recommendations.extend([
            "Continue healthy lifestyle habits",
            "Stay physically active",
            "Maintain balanced diet",
            "Regular health check-ups"
        ])
    
    # Add specific recommendations based on factors
    if bmi > 25:
        recommendations.append("Focus on weight management through diet and exercise")
    
    if activity_level < 3:
        recommendations.append("Increase daily physical activity")
    
    if sugar_intake > 50:
        recommendations.append("Significantly reduce sugar consumption")
    
    return recommendations[:6]  # Limit to 6 recommendations

@router.post("/risk")
async def assess_health_risk(request: dict):
    try:
        bmi = request.get("bmi", 25)
        age = request.get("age", 35)
        avg_daily_sugar = request.get("avg_daily_sugar", 50)
        activity_level = request.get("activity_level", 3)
        
        # Validate inputs
        if not all(isinstance(x, (int, float)) for x in [bmi, age, avg_daily_sugar, activity_level]):
            raise HTTPException(status_code=400, detail="All parameters must be numeric")
        
        if not (10 <= bmi <= 50):
            raise HTTPException(status_code=400, detail="BMI must be between 10 and 50")
        
        if not (18 <= age <= 100):
            raise HTTPException(status_code=400, detail="Age must be between 18 and 100")
        
        if not (0 <= avg_daily_sugar <= 200):
            raise HTTPException(status_code=400, detail="Daily sugar must be between 0 and 200g")
        
        if not (1 <= activity_level <= 5):
            raise HTTPException(status_code=400, detail="Activity level must be between 1 and 5")
        
        # Calculate risk score
        diabetes_risk_score = calculate_diabetes_risk_score(bmi, age, avg_daily_sugar, activity_level)
        
        # Determine risk level and color
        risk_level = get_risk_level(diabetes_risk_score)
        risk_color = get_risk_color(risk_level)
        
        # Calculate related risks
        obesity_risk = "High" if bmi > 30 else "Moderate" if bmi > 25 else "Low"
        hypertension_risk = "High" if bmi > 30 or age > 60 else "Moderate" if bmi > 25 or age > 45 else "Low"
        
        # Generate recommendations
        recommendations = generate_recommendations(risk_level, bmi, activity_level, avg_daily_sugar)
        
        return {
            "success": True,
            "diabetes_risk_score": diabetes_risk_score,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "obesity_risk": obesity_risk,
            "hypertension_risk": hypertension_risk,
            "recommendations": recommendations,
            "risk_factors": {
                "bmi": bmi,
                "age": age,
                "avg_daily_sugar": avg_daily_sugar,
                "activity_level": activity_level
            },
            "next_assessment": "6 months",
            "disclaimer": "This assessment is for informational purposes only and should not replace professional medical advice."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Risk assessment failed: {str(e)}"
        )
