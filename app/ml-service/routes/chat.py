from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import hashlib
import random

router = APIRouter()

# Smart response templates
RESPONSE_TEMPLATES = [
    "Based on your {streak}-day streak, you're clearly consistent! {goal_tip}",
    "Your avg of {avg_cal} kcal vs {cal_goal} goal means you're in a {status} 📊",
    "For {goal}, I recommend {meal_tip}. Your protein at {protein}g looks {protein_status}!",
    "Looking at your week: {workouts_done} workouts done. {workout_tip} 💪",
    "Great progress on {goal}! With {streak} days logged, {motivation_tip}",
    "Your {activity_level} activity level pairs well with {goal}. {nutrition_tip}",
    "With {total_meals} meals tracked, your consistency is impressive! {advice_tip}",
    "Your {goal_streak} goal streak shows dedication! {personalized_tip}"
]

# Helper functions for generating personalized responses
def get_goal_tip(goal, user_data):
    tips = {
        "lose_weight": "focus on a 500-calorie deficit through portion control",
        "build_muscle": "ensure 1.6-2.2g protein per kg body weight",
        "stay_fit": "maintain your current balanced routine",
        "gain_weight": "add 300-500 calories with nutrient-dense foods"
    }
    return tips.get(goal, "keep up the great work!")

def get_status(avg_cal, cal_goal):
    diff = avg_cal - cal_goal
    if diff > 200:
        return "slight surplus - consider reducing portions"
    elif diff < -200:
        return "deficit - great for weight loss"
    else:
        return "perfect range for your goals"

def get_protein_status(protein, protein_goal):
    if protein >= protein_goal:
        return "excellent - you're hitting your targets"
    elif protein >= protein_goal * 0.8:
        return "good - just a bit more to hit goal"
    else:
        return "low - consider adding protein-rich foods"

def get_workout_tip(workouts_done):
    if workouts_done >= 5:
        return "Consider adding an active recovery day"
    elif workouts_done >= 3:
        return "Great consistency! Keep it up"
    else:
        return "Try adding 1-2 more sessions this week"

def get_motivation_tip(goal):
    motivations = {
        "lose_weight": "every healthy choice counts toward your target",
        "build_muscle": "strength gains compound over time",
        "stay_fit": "consistency is your superpower",
        "gain_weight": "progressive overload will drive results"
    }
    return motivations.get(goal, "you're making amazing progress!")

def get_nutrition_tip(activity_level):
    tips = {
        1: "your light activity means focus on nutrient density",
        2: "moderate activity pairs well with balanced macros",
        3: "active lifestyle needs adequate fueling",
        4: "high activity requires strategic carb timing",
        5: "very active - prioritize recovery nutrition"
    }
    return tips.get(activity_level, "listen to your body's needs")

def get_advice_tip(total_meals):
    if total_meals >= 100:
        return "your tracking habit is paying dividends"
    elif total_meals >= 50:
        return "building excellent awareness"
    elif total_meals >= 20:
        return "great foundation forming"
    else:
        return "keep building this valuable habit"

def get_personalized_tip(goal_streak):
    if goal_streak >= 7:
        return "you've mastered the weekly rhythm"
    elif goal_streak >= 3:
        return "momentum is building nicely"
    else:
        return "focus on consistency over perfection"

@router.post("/chat")
async def chat_with_ai(request: dict):
    try:
        message = request.get("message", "")
        history = request.get("history", [])
        user_data = request.get("user_data", {})
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Extract user data with defaults
        streak = user_data.get("streak", 0)
        avg_cal = user_data.get("avg_calories", 1800)
        cal_goal = user_data.get("calorie_goal", 1800)
        protein = user_data.get("avg_protein", 100)
        protein_goal = user_data.get("protein_goal", 150)
        workouts_done = user_data.get("workouts_this_week", 3)
        goal = user_data.get("goal", "stay_fit")
        activity_level = user_data.get("activity_level", 3)
        total_meals = user_data.get("total_meals", 0)
        goal_streak = user_data.get("goal_streak", 0)
        
        # Generate consistent template selection based on message hash
        message_hash = int(hashlib.md5(message.encode()).hexdigest(), 16)
        template_index = message_hash % len(RESPONSE_TEMPLATES)
        template = RESPONSE_TEMPLATES[template_index]
        
        # Fill template with personalized data
        response = template.format(
            streak=streak,
            avg_cal=round(avg_cal),
            cal_goal=cal_goal,
            status=get_status(avg_cal, cal_goal),
            goal=goal,
            goal_tip=get_goal_tip(goal, user_data),
            protein=round(protein),
            protein_goal=protein_goal,
            protein_status=get_protein_status(protein, protein_goal),
            workouts_done=workouts_done,
            workout_tip=get_workout_tip(workouts_done),
            motivation_tip=get_motivation_tip(goal),
            activity_level=activity_level,
            nutrition_tip=get_nutrition_tip(activity_level),
            total_meals=total_meals,
            advice_tip=get_advice_tip(total_meals),
            goal_streak=goal_streak,
            personalized_tip=get_personalized_tip(goal_streak)
        )
        
        return {
            "success": True,
            "response": response,
            "timestamp": "2024-01-01T00:00:00Z",  # Mock timestamp
            "context_used": {
                "streak": streak,
                "avg_calories": round(avg_cal),
                "goal": goal,
                "workouts_this_week": workouts_done
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )
