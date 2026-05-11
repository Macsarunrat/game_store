from fastapi import Depends,HTTPException,status,Form
from sqlmodel import Session
from app.core.database import engine
from typing import Annotated
from .core.authentication import decode_role,oauth2_schema , decode_jwt
from .schema.images import ImageUpload






async def get_db():
    with Session(engine) as session :
        yield session

DbSession = Annotated[Session,Depends(get_db)]



def get_current_user_token(access_key : Annotated[str,Depends(oauth2_schema)]):
    print(f"DEBUG: RECEIVED TOKEN -> '{access_key}'")
    role_name = decode_role(access_key) 
    if role_name is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return role_name

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

    def __call__(self, payload = Depends(get_current_user_token)):
        user_role = payload

        print(f"\n====================================\n {user_role} \n==========================\n")

        if user_role not in self.required_permission:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail='Not Orthorized')
        return payload

def cast_to_json(game_id : Annotated[int, Form(...)],is_main : Annotated[bool,Form(...)]) -> ImageUpload:
    try:
        return ImageUpload(game_id=game_id,is_main=is_main)
    except:
        return HTTPException(status_code=422)