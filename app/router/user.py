from fastapi import APIRouter, Depends, status, HTTPException
from ..dependencies import DbSession
from typing import Annotated
from ..schema.user import UserLogin,UserLoginResponse,AccessToken,RefreshToken
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..crud import user as crud_user
from ..core.authentication import create_access_token,create_refresh_token,decode_jwt
from dotenv import load_dotenv
import uuid
load_dotenv()

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
        
        #permissions = await crud_user.get_role_and_permission(db=db,username=username)
        role_name = result['role_name']


        access_key = create_access_token({'sub':username,'role_name': role_name,'jti':str(uuid.uuid4())})
        refresh_key = create_refresh_token({'sub':username})

        result.update({'token':{
            'access_key': access_key,
            'refresh_key' : refresh_key
        }})
        
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Error {e}")

    return ResponseTemplateConstructor(
        200,'OK','Login successfully',result
        )


@router.post('/refresh', response_model=ResponseTemplate[AccessToken])
async def refresh_key(data: RefreshToken, db : DbSession):
    payload = decode_jwt(data.refresh_key)
    if not payload:
        return ResponseTemplateConstructor(401,'UNORTHORIZED','ไม่พบ refresh key', None)
    username = payload
    user = await crud_user.authenticate_user(db=db,username=username)
    new_access_key = create_access_token({'sub':user['username']})

    reponse = {'access_key': new_access_key,
                'type': 'bearer'
               }
    
    return ResponseTemplateConstructor(200,'OK','create access key successfully',reponse)
    