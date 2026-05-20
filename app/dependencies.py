from fastapi import Depends,HTTPException,status,Form, Request
from sqlmodel import Session
from app.core.database import engine
from typing import Annotated
from .core.authentication import decode_role,oauth2_schema , decode_jwt
from .schema.images import ImageUpload
import redis.asyncio as redis
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_database_session



DbSession = Annotated[Session,Depends(get_database_session)]



# def get_current_user_token(access_key : Annotated[str,Depends(oauth2_schema)]):
#     print(f"DEBUG: RECEIVED TOKEN -> '{access_key}'")
#     role_name = decode_role(access_key) 
#     if role_name is None:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
#     return role_name

def get_user(access_key : Annotated[str, Depends(oauth2_schema)]):
    print("ACCESS KEY")
    print(access_key)

    user_data = decode_jwt(access_key)
    print("USER DATA")
    print(user_data)
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="invalid token")
    return user_data

class RequirePermission:
    def __init__(self, required_permission: list):
        self.required_permission = required_permission

    def __call__(self, payload = Depends(get_user)):
        user_role = payload.get('role_name')

        print(f"\n====================================\n {user_role} \n==========================\n")

        if user_role not in self.required_permission:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail='Not Orthorized')
        return payload

def cast_to_json(game_id : Annotated[int, Form(...)],is_main : Annotated[bool,Form(...)]) -> ImageUpload:
    try:
        return ImageUpload(game_id=game_id,is_main=is_main)
    except:
        return HTTPException(status_code=422)
    

async def get_redis(request : Request) -> redis.Redis:
    if not hasattr(request.app.state, "redis") or request.app.state.redis is None :
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail="redis is not working")
    return request.app.state.redis