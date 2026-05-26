from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
import logging
from datetime import datetime
import asyncio
import os

# Import routers
from routes import detect, forecast, recipe, chat, workout, mealplan, risk

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for request/response validation
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
    uptime: float

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="NutriAI ML Service",
    description="Advanced Machine Learning microservice for NutriAI application with enhanced AI capabilities",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*"] if os.getenv("ENVIRONMENT") == "development" else ["yourdomain.com"]
)

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:5000",
        "https://yourdomain.com"  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            timestamp=datetime.now()
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"General Exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if os.getenv("ENVIRONMENT") == "development" else None,
            timestamp=datetime.now()
        ).dict()
    )

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = asyncio.get_event_loop().time()
    
    # Process request
    response = await call_next(request)
    
    # Log request
    process_time = asyncio.get_event_loop().time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    # Add custom headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = "2.0.0"
    
    return response

# Include routers with proper prefixes
app.include_router(detect.router,   prefix="/api/v1", tags=["Food Detection"])
app.include_router(forecast.router, prefix="/api/v1", tags=["Health Forecast"])
app.include_router(recipe.router,   prefix="/api/v1", tags=["Recipe Suggestions"])
app.include_router(chat.router,     prefix="/api/v1", tags=["AI Chat"])
app.include_router(workout.router,  prefix="/api/v1", tags=["Workout Planning"])
app.include_router(mealplan.router, prefix="/api/v1", tags=["Meal Planning"])
app.include_router(risk.router,     prefix="/api/v1", tags=["Health Risk Analysis"])

# Enhanced health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Enhanced health check with service status and metrics"""
    return HealthResponse(
        status="healthy",
        service="NutriAI ML Service",
        version="2.0.0",
        timestamp=datetime.now(),
        uptime=asyncio.get_event_loop().time()
    )

# API info endpoint
@app.get("/info", tags=["Health"])
async def api_info():
    """Get API information and available endpoints"""
    return {
        "name": "NutriAI ML Service",
        "version": "2.0.0",
        "description": "Advanced ML service for nutrition and fitness analysis",
        "endpoints": {
            "food_detection": "/api/v1/detect",
            "health_forecast": "/api/v1/forecast",
            "recipe_suggestions": "/api/v1/recipe",
            "ai_chat": "/api/v1/chat",
            "workout_planning": "/api/v1/workout",
            "meal_planning": "/api/v1/mealplan",
            "risk_analysis": "/api/v1/risk"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    }

# Root endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "NutriAI ML Service v2.0.0",
        "status": "running",
        "docs": "/docs"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 NutriAI ML Service v2.0.0 starting up...")
    logger.info("📍 Health check available at: http://localhost:8000/health")
    logger.info("📚 Documentation available at: http://localhost:8000/docs")
    logger.info("🔍 ReDoc available at: http://localhost:8000/redoc")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 NutriAI ML Service shutting down...")

# Run the application
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    environment = os.getenv("ENVIRONMENT", "development")
    
    logger.info(f"🌍 Environment: {environment}")
    logger.info(f"🚀 Starting NutriAI ML Service on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=environment == "development",
        log_level="info",
        access_log=True
    )
