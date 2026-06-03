from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import routers
from routes import detect, forecast, recipe, chat, workout, mealplan, risk

app = FastAPI(
    title="NutriAI ML Service",
    description="Machine Learning microservice for NutriAI application",
    version="1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers WITHOUT /api prefix so routes match what mlProxy.js calls:
#   mlProxy -> ML_SERVICE_URL + /detect
#   mlProxy -> ML_SERVICE_URL + /forecast
#   mlProxy -> ML_SERVICE_URL + /recipe-suggestions
#   mlProxy -> ML_SERVICE_URL + /chat
app.include_router(detect.router,   tags=["detect"])
app.include_router(forecast.router, tags=["forecast"])
app.include_router(recipe.router,   tags=["recipe"])
app.include_router(chat.router,     tags=["chat"])
app.include_router(workout.router,  tags=["workout"])
app.include_router(mealplan.router, tags=["mealplan"])
app.include_router(risk.router,     tags=["risk"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "NutriAI ML",
        "version": "1.0"
    }

@app.on_event("startup")
async def startup_event():
    print("NutriAI ML Service ready on port 8000")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
