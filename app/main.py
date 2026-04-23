from fastapi import FastAPI,APIRouter,HTTPException,Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.database import create_db_and_tb
from .router import user,game,order
from .schema.template import ResponseTemplateConstructor

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tb()
    yield


app = FastAPI(lifespan=lifespan,title="Game Shop",version='1.0.0')

api_v1_router = APIRouter(prefix='/api/v1')
api_v1_router.include_router(user.router)
api_v1_router.include_router(game.router)
api_v1_router.include_router(order.router)



app.include_router(api_v1_router)



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


