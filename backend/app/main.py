from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import (
    tickets_router,
    side_convos_router,
    routing_router,
    insights_router,
    export_router,
    users_router,
)

# Auto-create all tables in SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Next-generation B2B travel operations ticketing platform for TBO.com",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend Next.js application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Next.js client access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api/v1 prefix
app.include_router(tickets_router, prefix=settings.API_V1_PREFIX)
app.include_router(side_convos_router, prefix=settings.API_V1_PREFIX)
app.include_router(routing_router, prefix=settings.API_V1_PREFIX)
app.include_router(insights_router, prefix=settings.API_V1_PREFIX)
app.include_router(export_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OpsDesk API Engine",
        "version": "1.0.0",
    }


@app.get("/")
def root():
    return {
        "name": "OpsDesk B2B Travel Operations Platform",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
    }
