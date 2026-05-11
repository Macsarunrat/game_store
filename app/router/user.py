from fastapi import APIRouter, Depends, status, HTTPException, WebSocket, WebSocketDisconnect
from ..dependencies import DbSession,RequirePermission
from typing import Annotated
from ..schema.user import UserLogin,UserLoginResponse,AccessToken,RefreshToken
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..crud import user as crud_user
from ..core.authentication import create_access_token,create_refresh_token,decode_jwt
from dotenv import load_dotenv
import uuid
from fastapi.security import OAuth2PasswordRequestForm

load_dotenv()

router = APIRouter(
    prefix="/user",
    tags=['user']
)

@router.post('/login',response_model=ResponseTemplate[UserLoginResponse])
async def login(db : DbSession, form_data : Annotated[OAuth2PasswordRequestForm,Depends()]):
    try:
        jti = str(uuid.uuid4())

        username = form_data.username
        password = form_data.password
        result = await crud_user.login(db,username=username,password=password, jti=jti)

        if not result :
            return ResponseTemplateConstructor(
                401,'UNORTHORIZED','username หรือ password ไม่ถูกต้อง',None
                )
        
        #permissions = await crud_user.get_role_and_permission(db=db,username=username)
        role_name = result['role_name']
        user_id = result['user_id']


        
        access_key = create_access_token({'sub':username,'role_name': role_name,'user_id': user_id})
        refresh_key = create_refresh_token({'sub':username,'jti':jti})

        result.update({'token':{
            'access_token': access_key,
            'refresh_token' : refresh_key,
            'token_type':'bearer'
        }})
        
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Error {e}")

    return ResponseTemplateConstructor(
        200,'OK','Login successfully',result
        )


@router.post('/refresh', response_model=ResponseTemplate[AccessToken])
async def refresh_key(data: RefreshToken, db : DbSession):
    payload = decode_jwt(data.refresh_token)
    if not payload:
        return ResponseTemplateConstructor(401,'UNORTHORIZED','ไม่พบ refresh key', None)
    username = payload.get('sub')
    jti = payload.get('jti')
    result = await crud_user.check_jti(db=db,jti=jti)
    if result['is_active'] == False:
        raise HTTPException(status_code=401,detail='refresh token ไม่ถูกต้อง')
    user = await crud_user.authenticate_user(db=db,username=username)
    new_access_key = create_access_token({'sub':user['username']})

    reponse = {'access_token': new_access_key,
                'token_type': 'bearer'
               }
    
    return ResponseTemplateConstructor(200,'OK','create access key successfully',reponse)


@router.post('/refresh/V.2', response_model=ResponseTemplate[AccessToken])
async def refresh_key_v2(db: DbSession, data : RefreshToken):
    print("data : ")
    print(data)
    print("refresh data")
    print(data.refresh_token)
    refresh_body = decode_jwt(data.refresh_token)
    if not refresh_body :
        raise HTTPException(status_code=400,detail="Refresh Token ไม่ถูกต้อง หรือผิดพลาด ")
    print("refresh_body")
    print(refresh_body)
    jti = refresh_body.get('jti')
    results = await crud_user.check_owner_refresh_key(db,jti)
    print("\nResult")
    print(results)
    if not results:
        raise HTTPException(status_code=400, detail="ไม่พบ Refresh Token")
    if results['is_active'] == False:
        raise HTTPException(status_code=400, detail="Refresh Token ไม่ถูกต้อง")
    username = results['username']
    role_name =results['role_name']
    user_id = results['id']
    print("\nusername :")
    print(username)
    new_access_key = create_access_token({'sub':username,'role_name':role_name,'user_id': user_id})

    reponse = {'access_token': new_access_key,
                'token_type': 'bearer'
            }
    
    return ResponseTemplateConstructor(200,'OK','create access key successfully',reponse)







@router.post('/logout',response_model= ResponseTemplate[str])
async def logout(db: DbSession, refresh_token : RefreshToken, current_user : Annotated[str,Depends(RequirePermission(['customer','admin','owner']))]):
    print('logout refresh token')
    print(refresh_token.refresh_token)
    refresh_token=refresh_token.refresh_token
    refresh_token = decode_jwt(refresh_token)
    print(refresh_token.get('jti'))
    jti = refresh_token.get('jti')
    await crud_user.logout(db,jti)
    return ResponseTemplateConstructor(200,'OK','Logout successfully',None)



