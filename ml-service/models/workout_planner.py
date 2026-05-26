import json
import random
from typing import List, Dict, Optional
from datetime import datetime

class WorkoutPlanner:
    def __init__(self):
        self.exercise_library = self._load_exercises()
        self.workout_templates = self._load_templates()
        
    def _load_exercises(self) -> List[Dict]:
        """
        Load exercise library
        """
        try:
            with open('data/exercises.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return self._get_mock_exercises()
    
    def _get_mock_exercises(self) -> List[Dict]:
        """
        Get mock exercise data
        """
        return [
            {
                "id": "push_ups",
                "name": "Push-ups",
                "category": "strength",
                "muscle_groups": ["chest", "shoulders", "triceps"],
                "equipment": "none",
                "difficulty": "beginner",
                "calories_per_minute": 7,
                "instructions": "Start in plank position, lower body to ground, push back up"
            },
            {
                "id": "squats",
                "name": "Squats",
                "category": "strength",
                "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
                "equipment": "none",
                "difficulty": "beginner",
                "calories_per_minute": 8,
                "instructions": "Stand with feet shoulder-width apart, lower hips, stand back up"
            },
            {
                "id": "running",
                "name": "Running",
                "category": "cardio",
                "muscle_groups": ["legs", "core"],
                "equipment": "none",
                "difficulty": "intermediate",
                "calories_per_minute": 12,
                "instructions": "Run at comfortable pace, maintain good form"
            }
        ]
    
    def _load_templates(self) -> Dict:
        """
        Load workout templates
        """
        return {
            "beginner_strength": {
                "name": "Beginner Strength Training",
                "duration": 30,
                "exercises": ["squats", "push_ups", "plank"],
                "focus": "full_body_strength"
            },
            "cardio_blast": {
                "name": "Cardio Blast",
                "duration": 20,
                "exercises": ["running", "jumping_jacks", "high_knees"],
                "focus": "cardiovascular"
            }
        }
    
    async def generate_workout_plan(self, user_profile: Dict, fitness_goals: List[str],
                                  available_equipment: List[str] = [],
                                  time_available: int = 30,
                                  difficulty: str = "intermediate") -> Dict:
        """
        Generate personalized workout plan
        """
        try:
            # Filter exercises based on equipment and difficulty
            suitable_exercises = self._filter_exercises(
                available_equipment, difficulty
            )
            
            # Select exercises based on goals
            selected_exercises = self._select_exercises_for_goals(
                suitable_exercises, fitness_goals, time_available
            )
            
            # Structure workout
            workout_plan = self._structure_workout(selected_exercises, time_available)
            
            # Calculate estimated calories and metrics
            estimated_calories = self._estimate_calories(workout_plan)
            
            return {
                "name": f"Personalized {difficulty.title()} Workout",
                "duration": time_available,
                "exercises": workout_plan,
                "estimated_calories": estimated_calories,
                "warm_up": self._generate_warm_up(),
                "cool_down": self._generate_cool_down(),
                "focus_areas": self._get_focus_areas(fitness_goals)
            }
            
        except Exception as e:
            raise Exception(f"Workout plan generation failed: {str(e)}")
    
    def _filter_exercises(self, equipment: List[str], difficulty: str) -> List[Dict]:
        """
        Filter exercises based on available equipment and difficulty
        """
        filtered = []
        
        for exercise in self.exercise_library:
            # Check equipment
            if equipment and exercise["equipment"] not in equipment and exercise["equipment"] != "none":
                continue
            
            # Check difficulty
            if exercise["difficulty"] != difficulty and difficulty != "mixed":
                continue
            
            filtered.append(exercise)
        
        return filtered
    
    def _select_exercises_for_goals(self, exercises: List[Dict], 
                                   goals: List[str], time_available: int) -> List[Dict]:
        """
        Select exercises based on fitness goals
        """
        selected = []
        
        # Map goals to exercise categories
        goal_categories = {
            "weight_loss": ["cardio"],
            "muscle_gain": ["strength"],
            "endurance": ["cardio", "strength"],
            "flexibility": ["flexibility"]
        }
        
        target_categories = []
        for goal in goals:
            target_categories.extend(goal_categories.get(goal, []))
        
        # Remove duplicates
        target_categories = list(set(target_categories))
        
        # Select exercises from target categories
        for category in target_categories:
            category_exercises = [ex for ex in exercises if ex["category"] == category]
            selected.extend(category_exercises[:2])  # Limit exercises per category
        
        # Add variety if needed
        if len(selected) < 3:
            remaining = [ex for ex in exercises if ex not in selected]
            selected.extend(remaining[:3-len(selected)])
        
        return selected[:5]  # Limit total exercises
    
    def _structure_workout(self, exercises: List[Dict], total_time: int) -> List[Dict]:
        """
        Structure workout with sets, reps, and timing
        """
        structured = []
        time_per_exercise = total_time // len(exercises)
        
        for exercise in exercises:
            if exercise["category"] == "strength":
                structured.append({
                    "exercise": exercise,
                    "sets": 3,
                    "reps": 12,
                    "rest_time": 60,
                    "duration": time_per_exercise
                })
            elif exercise["category"] == "cardio":
                structured.append({
                    "exercise": exercise,
                    "duration": time_per_exercise,
                    "intensity": "moderate"
                })
        
        return structured
    
    def _estimate_calories(self, workout_plan: List[Dict]) -> int:
        """
        Estimate calories burned during workout
        """
        total_calories = 0
        
        for exercise_data in workout_plan:
            exercise = exercise_data["exercise"]
            
            if exercise["category"] == "strength":
                duration = exercise_data.get("duration", 10)
            else:
                duration = exercise_data.get("duration", 10)
            
            calories_per_minute = exercise.get("calories_per_minute", 5)
            total_calories += duration * calories_per_minute
        
        return total_calories
    
    def _generate_warm_up(self) -> List[Dict]:
        """
        Generate warm-up routine
        """
        return [
            {"name": "Light Jogging", "duration": 5, "intensity": "low"},
            {"name": "Dynamic Stretching", "duration": 3, "intensity": "low"},
            {"name": "Arm Circles", "duration": 2, "intensity": "low"}
        ]
    
    def _generate_cool_down(self) -> List[Dict]:
        """
        Generate cool-down routine
        """
        return [
            {"name": "Light Walking", "duration": 3, "intensity": "low"},
            {"name": "Static Stretching", "duration": 5, "intensity": "low"},
            {"name": "Deep Breathing", "duration": 2, "intensity": "low"}
        ]
    
    def _get_focus_areas(self, goals: List[str]) -> List[str]:
        """
        Get focus areas based on goals
        """
        focus_mapping = {
            "weight_loss": ["cardio", "full_body"],
            "muscle_gain": ["strength", "hypertrophy"],
            "endurance": ["cardio", "stamina"],
            "flexibility": ["stretching", "mobility"]
        }
        
        focus_areas = []
        for goal in goals:
            focus_areas.extend(focus_mapping.get(goal, []))
        
        return list(set(focus_areas))
    
    async def analyze_workout(self, workout_data: Dict) -> Dict:
        """
        Analyze completed workout and provide feedback
        """
        try:
            completed_exercises = workout_data.get("exercises", [])
            duration = workout_data.get("duration", 0)
            
            # Calculate metrics
            total_exercises = len(completed_exercises)
            estimated_calories = workout_data.get("calories_burned", 0)
            
            # Generate analysis
            analysis = {
                "total_exercises": total_exercises,
                "duration": duration,
                "estimated_calories": estimated_calories,
                "intensity_score": self._calculate_intensity_score(completed_exercises),
                "balance_score": self._calculate_balance_score(completed_exercises),
                "consistency_bonus": duration > 20,
                "improvement_areas": []
            }
            
            # Add improvement suggestions
            if analysis["balance_score"] < 0.7:
                analysis["improvement_areas"].append("Add more variety to exercise selection")
            
            if analysis["intensity_score"] < 0.6:
                analysis["improvement_areas"].append("Consider increasing workout intensity")
            
            return analysis
            
        except Exception as e:
            raise Exception(f"Workout analysis failed: {str(e)}")
    
    def _calculate_intensity_score(self, exercises: List[Dict]) -> float:
        """
        Calculate workout intensity score
        """
        if not exercises:
            return 0.0
        
        total_intensity = 0
        for exercise in exercises:
            # Simple intensity calculation based on exercise type
            if exercise.get("category") == "cardio":
                total_intensity += 0.8
            elif exercise.get("category") == "strength":
                total_intensity += 0.6
            else:
                total_intensity += 0.4
        
        return min(1.0, total_intensity / len(exercises))
    
    def _calculate_balance_score(self, exercises: List[Dict]) -> float:
        """
        Calculate workout balance score (variety of muscle groups)
        """
        if not exercises:
            return 0.0
        
        muscle_groups = set()
        for exercise in exercises:
            muscle_groups.update(exercise.get("muscle_groups", []))
        
        # Score based on variety of muscle groups worked
        return min(1.0, len(muscle_groups) / 6)  # Assuming 6 major muscle groups
    
    def get_recommendations(self, analysis: Dict) -> List[str]:
        """
        Get workout recommendations based on analysis
        """
        recommendations = []
        
        if analysis.get("intensity_score", 0) < 0.6:
            recommendations.append("Try increasing weights or reducing rest time")
        
        if analysis.get("balance_score", 0) < 0.7:
            recommendations.append("Include exercises for different muscle groups")
        
        if analysis.get("duration", 0) < 20:
            recommendations.append("Aim for at least 20 minutes per workout")
        
        recommendations.append("Stay hydrated during workouts")
        recommendations.append("Focus on proper form over speed")
        
        return recommendations
    
    async def get_exercise_library(self) -> List[Dict]:
        """
        Get full exercise library
        """
        return self.exercise_library
