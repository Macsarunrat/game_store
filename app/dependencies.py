from fastapi import Depends,HTTPException,status,Form
from sqlmodel import Session
from app.core.database import engine
from typing import Annotated
from .core.authentication import decode_role
from .schema.images import ImageUpload





async def get_db():
    with Session(engine) as session :
        yield session

DbSession = Annotated[Session,Depends(get_db)]



def get_current_user_token(access_key : str):
    payload = decode_role(access_key) 
    if payload is None:
        raise HTTPException(status_code=401,status=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return payload


class RequirePermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, payload = Depends(get_current_user_token)):
        user_role = payload

        if self.required_permission != user_role:
            raise HTTPException(status_code=403,status=status.HTTP_403_FORBIDDEN,detail='Not Orthorized')
        return payload

def cast_to_json(game_id : Annotated[int, Form(...)],is_main : Annotated[bool,Form(...)]) -> ImageUpload:
    try:
        return ImageUpload(game_id=game_id,is_main=is_main)
    except:
        return HTTPException(status_code=422)