from fastapi import Depends,HTTPException,status
from sqlmodel import Session
from app.core.database import engine
from typing import Annotated
from .core.authentication import decode_access_key





async def get_db():
    with Session(engine) as session :
        yield session

DbSession = Annotated[Session,Depends(get_db)]



def get_current_user_token(access_key : str):
    payload = decode_access_key(access_key) 
    if payload is None:
        raise HTTPException(status_code=401,status=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return payload


class RequirePermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, payload = Depends(get_current_user_token)):
        user_permission = payload.get('permission', [])

        if self.required_permission not in user_permission:
            raise HTTPException(status_code=403,status=status.HTTP_403_FORBIDDEN,detail='Not Orthorized')
        return payload
