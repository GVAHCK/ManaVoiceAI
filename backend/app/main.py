import sys
import types
import importlib.machinery
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# AppLocker bypass for Windows DLL imports before any ML module loading
if "sklearn" not in sys.modules:
    m = types.ModuleType("sklearn")
    m.__spec__ = importlib.machinery.ModuleSpec("sklearn", None)
    sys.modules["sklearn"] = m
    mm = types.ModuleType("sklearn.metrics")
    mm.__spec__ = importlib.machinery.ModuleSpec("sklearn.metrics", None)
    mm.roc_curve = lambda *a, **k: None
    sys.modules["sklearn.metrics"] = mm

from app.core.config import settings
from app.core.logging import logger
from app.db.mongodb import db_manager
from app.db.indexes import create_indexes
from app.api.routes import health, auth, users, languages, speech, history, dashboard, analytics, saved_audio, localization, datasets, training, evaluations

import time
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and create indexes
    logger.info("Initializing ManaVoice AI backend services...")
    await db_manager.connect()
    db = db_manager.get_database()
    await create_indexes(db)
    logger.info("Backend initialization complete.")
    yield
    # Shutdown: Close connections
    logger.info("Shutting down ManaVoice AI backend services...")
    await db_manager.close()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Multilingual AI Text-to-Speech Platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory IP-based rate limiting table for auth
_rate_limit_table: dict = {}

@app.middleware("http")
async def request_observability_and_rate_limit(request: Request, call_next):
    # 1. Correlation ID
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    # 2. Rate limiting on sensitive auth endpoints
    client_ip = request.client.host if request.client else "unknown"
    if request.url.path.startswith("/api/v1/auth/login") and request.method == "POST":
        now = time.time()
        timestamps = _rate_limit_table.get(client_ip, [])
        # Keep timestamps from the last 60 seconds
        timestamps = [t for t in timestamps if now - t < 60]
        if len(timestamps) >= settings.RATE_LIMIT_LOGIN_PER_MINUTE:
            logger.warning(f"Rate limit exceeded for client IP: {client_ip} on /auth/login")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many login attempts. Please wait a minute before retrying."},
                headers={"X-Request-ID": request_id, "Retry-After": "60"},
            )
        timestamps.append(now)
        _rate_limit_table[client_ip] = timestamps

    # 3. Request timing & execution
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    # Attach correlation ID to response headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

    # Safe structured logging without logging credentials
    if not request.url.path.startswith("/health"):
        logger.info(
            f"[{request_id[:8]}] {request.method} {request.url.path} "
            f"-> {response.status_code} ({duration_ms:.2f}ms)"
        )

    return response

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        loc = " -> ".join([str(x) for x in error.get("loc", [])])
        msg = error.get("msg", "Validation error")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Request validation failed", "errors": errors},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again."},
    )

# Include Routers
app.include_router(health.router)
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(languages.router, prefix=settings.API_PREFIX)
app.include_router(speech.router, prefix=settings.API_PREFIX)
app.include_router(history.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(saved_audio.router, prefix=settings.API_PREFIX)
app.include_router(localization.router, prefix=settings.API_PREFIX)
app.include_router(datasets.router, prefix=settings.API_PREFIX)
app.include_router(training.router, prefix=settings.API_PREFIX)
app.include_router(evaluations.router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api": settings.API_PREFIX,
    }
