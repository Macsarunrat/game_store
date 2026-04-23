from fastapi import FastAPI,APIRouter
from contextlib import asynccontextmanager
from app.core.database import create_db_and_tb
from .router import user,game

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tb()
    yield


app = FastAPI(lifespan=lifespan,title="Game Shop",version='1.0.0')

api_v1_router = APIRouter(prefix='/api/v1')
api_v1_router.include_router(user.router)
api_v1_router.include_router(game.router)



app.include_router(api_v1_router)