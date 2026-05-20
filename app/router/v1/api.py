

from fastapi import APIRouter

from app.router.v1.endpoints import chat, dashboard, game, images, order, user,email



api_v1_router = APIRouter(prefix='/api/v1')
api_v1_router.include_router(user.router)
api_v1_router.include_router(game.router)
api_v1_router.include_router(order.router)
api_v1_router.include_router(images.router)
api_v1_router.include_router(chat.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(email.router)