import jwt
from datetime import timedelta,datetime
import os
from dotenv import load_dotenv
from jwt import PyJWTError


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
ALGORITHM = os.getenv("ALGORITHM")

def create_access_token(data:dict, expire_time: timedelta | None = None):
    to_encode = data.copy()

    if expire_time:
        expire = datetime.now() + expire_time
    if not expire_time:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encodejwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encodejwt

def create_refresh_token(data:dict):
    to_encode = data.copy()
    refresh_key_time = timedelta(days=7)
    refresh_key = create_access_token(to_encode,refresh_key_time)
    return refresh_key


def decode_jwt(token:str):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=ALGORITHM)
        user = payload.get('sub')
        if not user:
            return None
        return user
    except PyJWTError:
        return None

def decode_access_key(acceses_key :str):
    try:
        payload = jwt.decode(acceses_key,SECRET_KEY,algorithms=ALGORITHM)
        user = payload.get('sub')
        permissions = payload.get('permission')
        if not user:
            return None
        
        if not permissions:
            return None
        


        return permissions
    except PyJWTError:
        return None

