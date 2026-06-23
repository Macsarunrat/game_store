from fastapi import APIRouter
from .endpoints import dashboard


api_v2_router = APIRouter(
    prefix='/api/v2'
)



api_v2_router.include_router(dashboard.router)