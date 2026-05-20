from fastapi import FastAPI,APIRouter,HTTPException,Request,File,UploadFile
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.database import create_db_and_tb
from app.router.v1.api import api_v1_router
from .schema.template import ResponseTemplateConstructor
import shutil
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
import os

from app.utils import stripe


redis_client : redis.Redis | None = None

redis_url = os.getenv("REDIS_URL","redis://localhost:6379/0")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client

    redis_client = redis.from_url(
        url=redis_url,
        decode_responses = True
    )

    app.state.redis = redis_client

    try:
        await redis_client.ping()
    except redis.ConnectionError:
        print('Failed to connect to redis')



    await create_db_and_tb()
    yield
    if hasattr(app.state, "redis"):
        await app.state.redis.aclose()



app = FastAPI(lifespan=lifespan,title="Game Shop",version='1.0.0')


app.include_router(api_v1_router)
app.include_router(stripe.router)

app.mount('/static',StaticFiles(directory="upload"),'upload')


@app.exception_handler(HTTPException)
def handle_exception(request: Request,error:HTTPException):

    error_content = ResponseTemplateConstructor(
        status_code=error.status_code,
        status="error",
        message=error.detail,
        detail=None
    )

    return JSONResponse(
        status_code=error.status_code,
        content=error_content.__dict__
        )


origins = [
    'http://localhost:4200',
    "http://127.0.0.1:4200",
    "http://192.168.1.63:8000",
    '*'
]
origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = False,
    allow_methods =['*'],
    allow_headers =['*']
)
