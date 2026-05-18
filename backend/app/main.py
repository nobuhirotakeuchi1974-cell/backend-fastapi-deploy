import logging
import os
import time
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from app.auth import create_access_token
from app.database import Base, engine
from app.routers import analytics, posts
from app.schemas import LoginRequest

logger = logging.getLogger("human-capital-os")
logger.setLevel(logging.INFO)
logger.propagate = False

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s request_id=%(request_id)s %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


logger.addFilter(RequestIdFilter())
logging.getLogger("uvicorn.access").addFilter(RequestIdFilter())
logging.getLogger("uvicorn.error").addFilter(RequestIdFilter())


app = FastAPI(title="Human Capital OS")


ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.3.31:3000",
    "https://tech0-gen-11-step3-2-py-62.azurewebsites.net",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()

    request.state.request_id = request_id

    try:
        response = await call_next(request)
    except Exception:
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.exception(
            "unhandled_exception method=%s path=%s process_time_ms=%s",
            request.method,
            request.url.path,
            process_time_ms,
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=500,
            content={
                "message": "サーバー側でエラーが発生しました。時間をおいて再度お試しください。",
                "request_id": request_id,
            },
        )

    process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-ms"] = str(process_time_ms)

    logger.info(
        "api_access method=%s path=%s status_code=%s process_time_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        process_time_ms,
        extra={"request_id": request_id},
    )

    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    logger.warning(
        "validation_error method=%s path=%s errors=%s",
        request.method,
        request.url.path,
        exc.errors(),
        extra={"request_id": request_id},
    )

    return JSONResponse(
        status_code=422,
        content={
            "message": "入力内容に誤りがあります。投稿内容・カテゴリ・ポイントを確認してください。",
            "request_id": request_id,
            "errors": exc.errors(),
        },
    )


@app.post("/api/auth/login", tags=["auth"])
def login(payload: LoginRequest, request: Request):
    request_id = getattr(request.state, "request_id", "-")

    expected_username = os.getenv("HCOS_ADMIN_USERNAME", "admin")
    expected_password = os.getenv("HCOS_ADMIN_PASSWORD", "password123")

    if payload.username != expected_username or payload.password != expected_password:
        logger.warning(
            "login_failed username=%s",
            payload.username,
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=401,
            content={
                "message": "ログインIDまたはパスワードが正しくありません。",
                "request_id": request_id,
            },
        )

    access_token = create_access_token(
        data={
            "sub": payload.username,
            "role": "manager",
        }
    )

    logger.info(
        "login_success username=%s",
        payload.username,
        extra={"request_id": request_id},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": payload.username,
            "role": "manager",
        },
    }


Base.metadata.create_all(bind=engine)

app.include_router(posts.router)

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["analytics"],
)


@app.get("/health")
def health():
    return {"status": "ok"}