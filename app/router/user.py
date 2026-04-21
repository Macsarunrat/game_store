from fastapi import APIRouter, Depends, status, HTTPException
from ..dependencies import DbSession
from typing import Annotated
from ..schema.user import UserLogin,UserLoginResponse
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..crud import user as crud_user

router = APIRouter(
    prefix="/user",
    tags=['user']
)

@router.post('/login',response_model=ResponseTemplate[UserLoginResponse])
async def login(db : DbSession, body : UserLogin):
    try:
        username = body.username
        password = body.password
        result = await crud_user.login(db,username=username,password=password)

        if not result :
            return ResponseTemplateConstructor(
                401,'UNORTHORIZED','username หรือ password ไม่ถูกต้อง',None
                )
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Error {e}")

    return ResponseTemplateConstructor(
        200,'ok','Login successfully',result
        )



