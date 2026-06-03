from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import random

router = APIRouter()

# Load exercises data
def load_exercises():
    try:
        with open("data/exercises.json", "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load exercises: {str(e)}")

# Workout schedule templates
WORKOUT_SCHEDULES = {
    "lose_weight": ["Upper", "Cardio", "Rest", "Lower", "Full", "Cardio", "Rest"],
    "build_muscle": ["Push", "Pull", "Rest", "Legs", "Push", "Pull", "Rest"],
    "stay_fit": ["Full", "Cardio", "Rest", "Full", "Cardio", "Rest", "Rest"]
}

def calculate_calories_burned(met_value, weight_kg, duration_min):
    """Calculate calories burned using MET formula"""
    return round((met_value * weight_kg * 3.5 / 200) * duration_min)

def get_exercises_by_category(exercises, category, equipment_available):
    """Get exercises that match category and available equipment"""
    filtered = []
    for exercise in exercises:
        if exercise["category"] == category:
            # Check if user has required equipment
            required_equipment = exercise.get("equipment", [])
            if not required_equipment or any(eq in equipment_available for eq in required_equipment):
                filtered.append(exercise)
    return filtered

@router.post("/workout")
async def generate_workout_plan(request: dict):
    try:
        profile = request.get("profile", {})
        
        # Extract profile data with defaults
        goal = profile.get("goal", "stay_fit")
        level = profile.get("level", "beginner")
        weight_kg = profile.get("weight_kg", 70)
        workout_days = profile.get("workout_days", 4)
        equipment = profile.get("equipment", [])
        
        # Load exercises
        exercises = load_exercises()
        
        # Get workout schedule
        schedule = WORKOUT_SCHEDULES.get(goal, WORKOUT_SCHEDULES["stay_fit"])
        
        # Generate 7-day plan
        workout_plan = {}
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        for i, day in enumerate(days_of_week):
            day_focus = schedule[i]
            
            if day_focus == "Rest":
                workout_plan[day] = {
                    "focus": "Rest",
                    "exercises": [],
                    "duration_min": 0,
                    "calories_burned": 0,
                    "completed": False
                }
            else:
                # Select exercises for this day
                category_exercises = get_exercises_by_category(exercises, day_focus, equipment)
                
                if not category_exercises:
                    # Fallback to bodyweight exercises
                    category_exercises = [ex for ex in exercises if ex["category"] == day_focus and not ex.get("equipment")]
                
                # Select 4 exercises (or fewer if not available)
                selected_exercises = random.sample(
                    category_exercises, 
                    min(4, len(category_exercises))
                )
                
                # Format exercises with completion status
                formatted_exercises = []
                total_duration = 0
                
                for exercise in selected_exercises:
                    exercise_data = {
                        "name": exercise["name"],
                        "sets": exercise["default_sets"],
                        "reps": exercise["default_reps"],
                        "rest_seconds": exercise["rest_seconds"],
                        "completed": False,
                        "muscle_group": exercise["muscle_group"],
                        "difficulty": exercise["difficulty"]
                    }
                    formatted_exercises.append(exercise_data)
                    
                    # Estimate duration (sets × (reps + rest))
                    if isinstance(exercise["default_reps"], str) and "s" in exercise["default_reps"]:
                        # Time-based exercise
                        duration_per_set = int(exercise["default_reps"].replace("s", ""))
                    else:
                        # Rep-based exercise (estimate 3 seconds per rep)
                        duration_per_set = int(exercise["default_reps"]) * 3
                    
                    total_duration += exercise["default_sets"] * (duration_per_set + exercise["rest_seconds"])
                
                # Calculate calories burned
                avg_met = sum(ex["met_value"] for ex in selected_exercises) / len(selected_exercises)
                calories_burned = calculate_calories_burned(avg_met, weight_kg, total_duration / 60)
                
                workout_plan[day] = {
                    "focus": day_focus,
                    "exercises": formatted_exercises,
                    "duration_min": round(total_duration / 60),
                    "calories_burned": calories_burned,
                    "completed": False
                }
        
        return {
            "success": True,
            "workout_plan": workout_plan,
            "profile_summary": {
                "goal": goal,
                "level": level,
                "weight_kg": weight_kg,
                "workout_days": workout_days,
                "equipment": equipment
            },
            "weekly_stats": {
                "total_workouts": len([w for w in workout_plan.values() if w["focus"] != "Rest"]),
                "total_duration": sum(w["duration_min"] for w in workout_plan.values()),
                "total_calories": sum(w["calories_burned"] for w in workout_plan.values())
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Workout plan generation failed: {str(e)}"
        )
