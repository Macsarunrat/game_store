from fastapi import FastAPI,APIRouter,HTTPException,Request,File,UploadFile
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.database import create_db_and_tb
from .router import user,game,order,images,chat
from .schema.template import ResponseTemplateConstructor
import shutil
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tb()
    yield



app = FastAPI(lifespan=lifespan,title="Game Shop",version='1.0.0')

api_v1_router = APIRouter(prefix='/api/v1')
api_v1_router.include_router(user.router)
api_v1_router.include_router(game.router)
api_v1_router.include_router(order.router)
api_v1_router.include_router(images.router)
api_v1_router.include_router(chat.router)



app.include_router(api_v1_router)

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
