from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import numpy as np
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.post("/forecast")
async def generate_forecast(request: dict):
    try:
        forecast_type = request.get("type", "calories")
        logs = request.get("logs", [])
        
        if not logs:
            raise HTTPException(status_code=400, detail="No historical data provided")
        
        # Generate forecast for next 30 days
        forecast_data = []
        start_date = datetime.now()
        
        if len(logs) >= 7:
            # Use linear regression with numpy polyfit
            dates = [datetime.strptime(log["date"], "%Y-%m-%d") for log in logs]
            values = [log["value"] for log in logs]
            
            # Convert dates to numeric values (days since start)
            numeric_dates = [(date - dates[0]).days for date in dates]
            
            # Fit linear regression
            coefficients = np.polyfit(numeric_dates, values, 1)
            trend = coefficients[0]  # Slope
            
            # Generate forecast
            for i in range(30):
                future_date = start_date + timedelta(days=i)
                future_numeric = (future_date - dates[0]).days
                predicted_value = np.polyval(coefficients, future_numeric)
                
                # Add some randomness for realism
                noise = random.uniform(-0.5, 0.5)
                
                forecast_data.append({
                    "ds": future_date.strftime("%Y-%m-%d"),
                    "yhat": max(0, predicted_value),
                    "yhat_lower": max(0, predicted_value - 0.5),
                    "yhat_upper": predicted_value + 0.5
                })
        else:
            # Use last value with small decrease for weight loss goals
            last_value = logs[-1]["value"]
            
            # Determine trend based on goal type
            if forecast_type in ["weight", "body_fat"]:
                daily_change = -0.05  # Small decrease for weight loss goals
            else:
                daily_change = 0.01  # Slight increase for other metrics
            
            for i in range(30):
                future_date = start_date + timedelta(days=i)
                predicted_value = last_value + (daily_change * i)
                
                # Add randomness
                noise = random.uniform(-0.3, 0.3)
                
                forecast_data.append({
                    "ds": future_date.strftime("%Y-%m-%d"),
                    "yhat": max(0, predicted_value + noise),
                    "yhat_lower": max(0, predicted_value + noise - 0.5),
                    "yhat_upper": predicted_value + noise + 0.5
                })
        
        return {
            "success": True,
            "forecast": forecast_data,
            "type": forecast_type,
            "data_points": len(logs)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {str(e)}"
        )
