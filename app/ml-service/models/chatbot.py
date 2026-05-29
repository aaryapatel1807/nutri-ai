import json
import re
from typing import List, Dict, Optional
from datetime import datetime

class NutritionChatbot:
    def __init__(self):
        self.intents = self._load_intents()
        self.responses = self._load_responses()
        
    def _load_intents(self) -> Dict:
        """
        Load intent patterns for query classification
        """
        return {
            "calorie_query": [
                r"how many calories",
                r"calorie count",
                r"calories in"
            ],
            "meal_suggestion": [
                r"what should i eat",
                r"meal suggestion",
                r"recommend food"
            ],
            "nutrition_info": [
                r"nutrition information",
                r"nutritional value",
                r"healthy food"
            ],
            "weight_management": [
                r"lose weight",
                r"gain weight",
                r"weight management"
            ],
            "exercise_advice": [
                r"exercise",
                r"workout",
                r"fitness"
            ]
        }
    
    def _load_responses(self) -> Dict:
        """
        Load response templates
        """
        return {
            "calorie_query": "I can help you with calorie information. Could you specify which food you're interested in?",
            "meal_suggestion": "Based on your goals, I'd recommend a balanced meal with protein, healthy fats, and complex carbs.",
            "nutrition_info": "That's a great question about nutrition! Different foods have different nutritional profiles.",
            "weight_management": "Weight management involves a balance of nutrition, exercise, and consistency.",
            "exercise_advice": "Regular exercise is crucial for overall health. What type of exercise are you interested in?",
            "fallback": "I'm here to help with nutrition and fitness questions. Could you rephrase your question?"
        }
    
    async def get_response(self, message: str, user_id: str, 
                          session_id: str, context: Dict = {}) -> Dict:
        """
        Generate response to user message
        """
        try:
            # Analyze user intent
            intent_analysis = await self.analyze_query(message)
            intent = intent_analysis["intent"]
            
            # Generate contextual response
            response = self._generate_response(message, intent, context)
            
            # Get follow-up suggestions
            suggestions = self._get_follow_up_suggestions(intent)
            
            return {
                "message": response,
                "intent": intent,
                "suggestions": suggestions,
                "follow_up_questions": self._get_follow_up_questions(intent)
            }
            
        except Exception as e:
            raise Exception(f"Chatbot response generation failed: {str(e)}")
    
    async def analyze_query(self, query: str) -> Dict:
        """
        Analyze user query to determine intent and extract entities
        """
        query_lower = query.lower()
        
        # Determine intent
        intent = "fallback"
        confidence = 0.0
        
        for intent_name, patterns in self.intents.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    intent = intent_name
                    confidence = 0.8
                    break
            if confidence > 0:
                break
        
        # Extract entities (simple implementation)
        entities = self._extract_entities(query)
        
        return {
            "intent": intent,
            "entities": entities,
            "confidence": confidence
        }
    
    def _extract_entities(self, query: str) -> Dict:
        """
        Extract entities from user query
        """
        entities = {}
        
        # Extract food items (simple keyword matching)
        food_keywords = ["chicken", "rice", "vegetables", "fruit", "salad", "pasta", "bread"]
        found_foods = [food for food in food_keywords if food in query.lower()]
        if found_foods:
            entities["foods"] = found_foods
        
        # Extract numbers (calories, weight, etc.)
        numbers = re.findall(r'\d+', query)
        if numbers:
            entities["numbers"] = [int(num) for num in numbers]
        
        return entities
    
    def _generate_response(self, message: str, intent: str, context: Dict) -> str:
        """
        Generate contextual response based on intent
        """
        base_response = self.responses.get(intent, self.responses["fallback"])
        
        # Add context-specific information
        if intent == "calorie_query" and "foods" in context:
            foods = context["foods"]
            base_response += f" I can provide calorie information for {', '.join(foods)}."
        
        elif intent == "meal_suggestion" and "time_of_day" in context:
            time_of_day = context["time_of_day"]
            if time_of_day == "morning":
                base_response += " For breakfast, I'd suggest something high in protein."
            elif time_of_day == "evening":
                base_response += " For dinner, consider a balanced meal with vegetables."
        
        return base_response
    
    def _get_follow_up_suggestions(self, intent: str) -> List[str]:
        """
        Get follow-up suggestions based on intent
        """
        suggestions = {
            "calorie_query": [
                "Tell me about protein content",
                "What are healthy fats?",
                "How to calculate daily calories?"
            ],
            "meal_suggestion": [
                "Suggest a high-protein meal",
                "What's a quick healthy snack?",
                "Meal prep ideas?"
            ],
            "nutrition_info": [
                "Vitamin information",
                "Mineral benefits",
                "Hydration tips"
            ],
            "weight_management": [
                "Healthy weight loss rate",
                "Metabolism boosting foods",
                "Portion control tips"
            ],
            "exercise_advice": [
                "Home workout routines",
                "Cardio vs strength training",
                "Recovery nutrition"
            ]
        }
        
        return suggestions.get(intent, [
            "Nutrition basics",
            "Healthy recipes",
            "Fitness tips"
        ])
    
    def _get_follow_up_questions(self, intent: str) -> List[str]:
        """
        Get follow-up questions based on intent
        """
        questions = {
            "calorie_query": [
                "What specific food are you interested in?",
                "Are you tracking daily calories?",
                "What's your calorie goal?"
            ],
            "meal_suggestion": [
                "What ingredients do you have available?",
                "Any dietary restrictions?",
                "How much time do you have for cooking?"
            ],
            "nutrition_info": [
                "Are you looking for general or specific information?",
                "Any particular nutrients of interest?",
                "Are you planning meals for someone specific?"
            ]
        }
        
        return questions.get(intent, [
            "What would you like to know more about?",
            "How can I help you achieve your health goals?"
        ])
    
    async def get_personalized_suggestions(self, user_id: str) -> List[str]:
        """
        Get personalized suggestions for a user
        """
        # Mock implementation - in production, fetch user data
        suggestions = [
            "Based on your recent meals, consider adding more vegetables",
            "Your protein intake has been low - try incorporating lean meats",
            "Great job staying hydrated! Keep it up.",
            "Consider meal prepping for the week ahead"
        ]
        
        return suggestions
