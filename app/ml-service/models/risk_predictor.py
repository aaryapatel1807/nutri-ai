import numpy as np
from typing import List, Dict, Optional
from datetime import datetime

class RiskPredictor:
    def __init__(self):
        self.risk_factors = self._load_risk_factors()
        self.risk_thresholds = self._load_risk_thresholds()
        
    def _load_risk_factors(self) -> Dict:
        """
        Load health risk factor data
        """
        return {
            "bmi": {
                "underweight": {"min": 0, "max": 18.5, "risk_level": "moderate"},
                "normal": {"min": 18.5, "max": 24.9, "risk_level": "low"},
                "overweight": {"min": 25, "max": 29.9, "risk_level": "moderate"},
                "obese": {"min": 30, "max": 50, "risk_level": "high"}
            },
            "blood_pressure": {
                "normal": {"systolic": [90, 120], "diastolic": [60, 80], "risk_level": "low"},
                "elevated": {"systolic": [120, 129], "diastolic": [60, 80], "risk_level": "moderate"},
                "high_stage1": {"systolic": [130, 139], "diastolic": [80, 89], "risk_level": "high"},
                "high_stage2": {"systolic": [140, 180], "diastolic": [90, 120], "risk_level": "very_high"}
            },
            "cholesterol": {
                "optimal": {"ldl": [0, 100], "risk_level": "low"},
                "near_optimal": {"ldl": [100, 129], "risk_level": "low"},
                "borderline_high": {"ldl": [130, 159], "risk_level": "moderate"},
                "high": {"ldl": [160, 189], "risk_level": "high"},
                "very_high": {"ldl": [190, 300], "risk_level": "very_high"}
            }
        }
    
    def _load_risk_thresholds(self) -> Dict:
        """
        Load risk assessment thresholds
        """
        return {
            "overall_risk": {
                "low": {"min": 0, "max": 30},
                "moderate": {"min": 30, "max": 60},
                "high": {"min": 60, "max": 80},
                "very_high": {"min": 80, "max": 100}
            }
        }
    
    async def assess_risks(self, user_profile: Dict, health_metrics: Dict,
                          lifestyle_data: Dict, family_history: List[str] = []) -> Dict:
        """
        Assess health risks based on comprehensive user data
        """
        try:
            risk_scores = {}
            
            # Calculate BMI risk
            if "height" in user_profile and "weight" in user_profile:
                bmi = self._calculate_bmi(user_profile["weight"], user_profile["height"])
                risk_scores["bmi"] = self._assess_bmi_risk(bmi)
            
            # Assess blood pressure risk
            if "blood_pressure" in health_metrics:
                bp = health_metrics["blood_pressure"]
                risk_scores["blood_pressure"] = self._assess_blood_pressure_risk(bp)
            
            # Assess cholesterol risk
            if "cholesterol" in health_metrics:
                cholesterol = health_metrics["cholesterol"]
                risk_scores["cholesterol"] = self._assess_cholesterol_risk(cholesterol)
            
            # Assess lifestyle risks
            lifestyle_risk = self._assess_lifestyle_risks(lifestyle_data)
            risk_scores["lifestyle"] = lifestyle_risk
            
            # Assess family history risk
            family_risk = self._assess_family_history_risk(family_history)
            risk_scores["family_history"] = family_risk
            
            # Calculate overall risk
            overall_risk = self._calculate_overall_risk(risk_scores)
            
            # Generate recommendations
            recommendations = self._generate_risk_recommendations(risk_scores, overall_risk)
            
            # Determine if consultation is needed
            consultation_needed = overall_risk["score"] >= 70
            
            return {
                "risk_scores": risk_scores,
                "overall_risk": overall_risk,
                "recommendations": recommendations,
                "consultation_needed": consultation_needed,
                "assessment_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Risk assessment failed: {str(e)}")
    
    def _calculate_bmi(self, weight_kg: float, height_cm: float) -> float:
        """
        Calculate BMI
        """
        height_m = height_cm / 100
        return weight_kg / (height_m ** 2)
    
    def _assess_bmi_risk(self, bmi: float) -> Dict:
        """
        Assess BMI-related risk
        """
        bmi_categories = self.risk_factors["bmi"]
        
        for category, ranges in bmi_categories.items():
            if ranges["min"] <= bmi < ranges["max"]:
                return {
                    "category": category,
                    "bmi_value": round(bmi, 2),
                    "risk_level": ranges["risk_level"],
                    "score": self._map_risk_level_to_score(ranges["risk_level"])
                }
        
        return {"category": "unknown", "risk_level": "unknown", "score": 50}
    
    def _assess_blood_pressure_risk(self, bp: Dict) -> Dict:
        """
        Assess blood pressure risk
        """
        systolic = bp.get("systolic", 120)
        diastolic = bp.get("diastolic", 80)
        
        bp_categories = self.risk_factors["blood_pressure"]
        
        for category, ranges in bp_categories.items():
            if (ranges["systolic"][0] <= systolic <= ranges["systolic"][1] and
                ranges["diastolic"][0] <= diastolic <= ranges["diastolic"][1]):
                return {
                    "category": category,
                    "systolic": systolic,
                    "diastolic": diastolic,
                    "risk_level": ranges["risk_level"],
                    "score": self._map_risk_level_to_score(ranges["risk_level"])
                }
        
        return {"category": "unknown", "risk_level": "unknown", "score": 50}
    
    def _assess_cholesterol_risk(self, cholesterol: Dict) -> Dict:
        """
        Assess cholesterol risk
        """
        ldl = cholesterol.get("ldl", 100)
        
        cholesterol_categories = self.risk_factors["cholesterol"]
        
        for category, ranges in cholesterol_categories.items():
            if ranges["ldl"][0] <= ldl <= ranges["ldl"][1]:
                return {
                    "category": category,
                    "ldl": ldl,
                    "risk_level": ranges["risk_level"],
                    "score": self._map_risk_level_to_score(ranges["risk_level"])
                }
        
        return {"category": "unknown", "risk_level": "unknown", "score": 50}
    
    def _assess_lifestyle_risks(self, lifestyle_data: Dict) -> Dict:
        """
        Assess lifestyle-related risks
        """
        risk_score = 0
        factors = []
        
        # Smoking
        if lifestyle_data.get("smoking") == True:
            risk_score += 25
            factors.append("smoking")
        
        # Alcohol consumption
        alcohol_freq = lifestyle_data.get("alcohol_frequency", "none")
        if alcohol_freq in ["daily", "weekly"]:
            risk_score += 15
            factors.append("alcohol_consumption")
        
        # Physical activity
        activity_level = lifestyle_data.get("activity_level", "sedentary")
        if activity_level == "sedentary":
            risk_score += 20
            factors.append("sedentary_lifestyle")
        elif activity_level == "light":
            risk_score += 10
            factors.append("low_activity")
        
        # Diet quality
        diet_quality = lifestyle_data.get("diet_quality", "poor")
        if diet_quality == "poor":
            risk_score += 15
            factors.append("poor_diet")
        elif diet_quality == "fair":
            risk_score += 5
            factors.append("suboptimal_diet")
        
        # Stress level
        stress_level = lifestyle_data.get("stress_level", "moderate")
        if stress_level == "high":
            risk_score += 10
            factors.append("high_stress")
        
        # Sleep quality
        sleep_quality = lifestyle_data.get("sleep_quality", "poor")
        if sleep_quality == "poor":
            risk_score += 10
            factors.append("poor_sleep")
        
        return {
            "score": min(100, risk_score),
            "factors": factors,
            "risk_level": self._map_score_to_risk_level(risk_score)
        }
    
    def _assess_family_history_risk(self, family_history: List[str]) -> Dict:
        """
        Assess family history risk
        """
        high_risk_conditions = [
            "heart_disease", "diabetes", "stroke", "high_blood_pressure",
            "high_cholesterol", "obesity", "cancer"
        ]
        
        risk_score = 0
        present_conditions = []
        
        for condition in family_history:
            if condition in high_risk_conditions:
                risk_score += 8
                present_conditions.append(condition)
        
        return {
            "score": min(100, risk_score),
            "conditions": present_conditions,
            "risk_level": self._map_score_to_risk_level(risk_score)
        }
    
    def _calculate_overall_risk(self, risk_scores: Dict) -> Dict:
        """
        Calculate overall risk score
        """
        if not risk_scores:
            return {"score": 0, "level": "low"}
        
        # Weight different risk factors
        weights = {
            "bmi": 0.25,
            "blood_pressure": 0.25,
            "cholesterol": 0.20,
            "lifestyle": 0.20,
            "family_history": 0.10
        }
        
        weighted_score = 0
        total_weight = 0
        
        for factor, data in risk_scores.items():
            if factor in weights and "score" in data:
                weighted_score += data["score"] * weights[factor]
                total_weight += weights[factor]
        
        if total_weight > 0:
            overall_score = weighted_score / total_weight
        else:
            overall_score = 0
        
        return {
            "score": round(overall_score, 1),
            "level": self._map_score_to_risk_level(overall_score),
            "confidence": 0.75  # Mock confidence score
        }
    
    def _map_risk_level_to_score(self, risk_level: str) -> int:
        """
        Map risk level to numeric score
        """
        mapping = {
            "low": 15,
            "moderate": 45,
            "high": 75,
            "very_high": 90
        }
        return mapping.get(risk_level, 50)
    
    def _map_score_to_risk_level(self, score: float) -> str:
        """
        Map numeric score to risk level
        """
        if score < 30:
            return "low"
        elif score < 60:
            return "moderate"
        elif score < 80:
            return "high"
        else:
            return "very_high"
    
    def _generate_risk_recommendations(self, risk_scores: Dict, overall_risk: Dict) -> List[str]:
        """
        Generate personalized risk reduction recommendations
        """
        recommendations = []
        
        # BMI recommendations
        if "bmi" in risk_scores:
            bmi_risk = risk_scores["bmi"]
            if bmi_risk["risk_level"] in ["moderate", "high", "very_high"]:
                recommendations.append("Consider weight management through balanced diet and regular exercise")
        
        # Blood pressure recommendations
        if "blood_pressure" in risk_scores:
            bp_risk = risk_scores["blood_pressure"]
            if bp_risk["risk_level"] in ["moderate", "high", "very_high"]:
                recommendations.append("Monitor blood pressure regularly and consider reducing sodium intake")
        
        # Lifestyle recommendations
        if "lifestyle" in risk_scores:
            lifestyle_risk = risk_scores["lifestyle"]
            if "smoking" in lifestyle_risk.get("factors", []):
                recommendations.append("Quit smoking to significantly reduce health risks")
            if "sedentary_lifestyle" in lifestyle_risk.get("factors", []):
                recommendations.append("Increase physical activity to at least 150 minutes per week")
            if "poor_diet" in lifestyle_risk.get("factors", []):
                recommendations.append("Improve diet quality by increasing fruits, vegetables, and whole grains")
        
        # General recommendations
        if overall_risk["score"] >= 60:
            recommendations.append("Schedule regular check-ups with healthcare provider")
            recommendations.append("Consider consulting with a nutritionist for personalized dietary guidance")
        
        # Add positive reinforcement
        recommendations.append("Continue monitoring your health metrics and maintaining healthy habits")
        
        return recommendations
    
    async def predict_outcomes(self, data: Dict) -> Dict:
        """
        Predict long-term health outcomes
        """
        try:
            # Mock prediction model
            current_risk = data.get("current_risk_score", 50)
            intervention_effectiveness = data.get("intervention_effectiveness", 0.7)
            
            # Predict 5-year outcomes
            baseline_prediction = current_risk
            with_intervention = current_risk * (1 - intervention_effectiveness * 0.5)
            
            predictions = {
                "5_year_risk_score": {
                    "baseline": baseline_prediction,
                    "with_intervention": max(10, with_intervention),
                    "improvement": baseline_prediction - with_intervention
                },
                "key_factors": [
                    "Weight management",
                    "Physical activity",
                    "Diet quality",
                    "Stress management",
                    "Regular check-ups"
                ],
                "confidence_intervals": {
                    "lower": max(5, with_intervention - 10),
                    "upper": min(95, with_intervention + 10)
                }
            }
            
            return predictions
            
        except Exception as e:
            raise Exception(f"Outcome prediction failed: {str(e)}")
    
    async def analyze_risk_factors(self, user_id: str) -> Dict:
        """
        Get detailed risk factor analysis for a user
        """
        # Mock implementation - in production, fetch user data from database
        return {
            "modifiable": [
                {"factor": "Body Weight", "impact": "high", "actionable": True},
                {"factor": "Physical Activity", "impact": "high", "actionable": True},
                {"factor": "Diet Quality", "impact": "moderate", "actionable": True},
                {"factor": "Stress Management", "impact": "moderate", "actionable": True},
                {"factor": "Sleep Quality", "impact": "moderate", "actionable": True}
            ],
            "non_modifiable": [
                {"factor": "Age", "impact": "moderate", "actionable": False},
                {"factor": "Genetics", "impact": "moderate", "actionable": False},
                {"factor": "Family History", "impact": "high", "actionable": False}
            ],
            "priority_actions": [
                "Focus on weight management through diet and exercise",
                "Increase physical activity to recommended levels",
                "Improve diet quality with more fruits and vegetables"
            ]
        }
