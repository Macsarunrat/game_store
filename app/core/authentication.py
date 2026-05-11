import jwt
from datetime import timedelta,datetime,timezone
import os
from dotenv import load_dotenv
from jwt import PyJWTError
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from fastapi import HTTPException


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
ALGORITHM = os.getenv("ALGORITHM")

oauth2_schema = OAuth2PasswordBearer(tokenUrl='api/v1/user/login')

def create_access_token(data:dict, expire_time: timedelta | None = None):
    to_encode = data.copy()

    if expire_time:
        expire = datetime.now(timezone.utc) + expire_time
    if not expire_time:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encodejwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    print(f"secret_key {SECRET_KEY}")
    return encodejwt

def create_refresh_token(data:dict):
    to_encode = data.copy()
    refresh_key_time = timedelta(days=7)
    refresh_key = create_access_token(to_encode,refresh_key_time)
    return refresh_key


def decode_jwt(token:str):
    try:

        payload = jwt.decode(token,SECRET_KEY,algorithms=ALGORITHM)
        user_data = payload
        print("\nuser_data")
        print(user_data)
        if not user_data:
            return None
        return user_data
    except PyJWTError:
        return None
    except jwt.ExpiredSignatureError :
        raise HTTPException(status_code=401, detail='Token หมดอายุ')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token ไม่ถูกต้อง')

def decode_role(access_key :str):
    try:
        payload = jwt.decode(access_key,SECRET_KEY,algorithms=ALGORITHM)
        user = payload.get('sub')
        role_name = payload.get('role_name')
        print(role_name)
        if not access_key or access_key.count('.') != 2:
            print("DEBUG: Token format is invalid (not 3 segments)")
            return None
        if not user:
            return None 
        if not role_name:
            raise HTTPException(status_code=401,detail='Invalid token or role not found')

        return role_name
    except jwt.ExpiredSignatureError :
        raise HTTPException(status_code=401,detail='Token หมดอายุ')
    except jwt.InvalidTokenError :
        raise HTTPException(status_code=401,detail='Token ไม่ถูกต้อง')
    except PyJWTError as e:
        return print(f"error {e}")
    